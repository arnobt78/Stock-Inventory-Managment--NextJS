/**
 * Server-side category detail fetch for SSR prefetch.
 * Mirrors GET /api/categories/:id auth + response shape (includes Redis cache).
 * REQ-0024, REQ-0081 — party enrichment + category insights.
 * REQ-0082 — forecast rollup removed from SSR (client TanStack + cache-read prefetch).
 */

import { getCategoryById } from "@/prisma/category";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { logger } from "@/lib/logger";
import { computeProportionalLineAmount } from "@/lib/orders/proportional-line-amount";
import { isOrderRecordCountedAsSold } from "@/lib/orders/order-sales-eligibility";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import {
  catalogDetailCacheScope,
  resolveSupplierEntityForSession,
  supplierCanAccessCategory,
} from "@/lib/server/catalog-entity-access";
import { toParty } from "@/lib/server/catalog-party-snapshot";
import {
  computeCatalogInsights,
  CATEGORY_LOW_STOCK_THRESHOLD,
} from "@/lib/server/catalog-insights";
import { enrichProductsWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { catalogDetailOrderSelect } from "@/lib/server/catalog-detail-order-select";
import { resolveOrderStatusAtFromSource } from "@/lib/orders/order-status-display-date";
import { resolveBuyerUserId } from "@/lib/orders/order-party";
import { getInvoiceLinkMap } from "@/lib/server/orders-data";

export { CATEGORY_LOW_STOCK_THRESHOLD };
export { computeCatalogInsights as computeCategoryInsights } from "@/lib/server/catalog-insights";

type SupplierRow = {
  id: string;
  name: string;
};

type UserRow = import("@/lib/server/catalog-party-snapshot").CatalogPartyUserRow;

type ProductWithOrders = Awaited<
  ReturnType<
    typeof prisma.product.findMany<{
      include: {
        orderItems: {
          include: {
            order: {
              select: typeof catalogDetailOrderSelect;
            };
          };
        };
      };
    }>
  >
>[number];

function transformCategoryDetail(
  category: NonNullable<Awaited<ReturnType<typeof getCategoryById>>>,
  products: ProductWithOrders[],
  creatorUser: UserRow | null,
  updaterUser: UserRow | null,
  ownerMap: Map<string, UserRow>,
  supplierMap: Map<string, SupplierRow>,
  orderUserMap: Map<string, UserRow>,
) {
  const totalProducts = products.length;
  let totalQuantitySold = 0;
  let totalRevenue = 0;
  const orderMap = new Map<
    string,
    { orderNumber: string; status: string; total: number; createdAt: Date }
  >();

  // REQ-0140 — sold stats = delivered or paid only
  products.forEach((product) => {
    product.orderItems?.forEach((item) => {
      const order = item.order;
      if (!order || !isOrderRecordCountedAsSold(order)) return;
      totalQuantitySold += item.quantity;
      const orderSubtotal = order.subtotal ?? 0;
      const share =
        orderSubtotal > 0
          ? (item.subtotal / orderSubtotal) * order.total
          : item.subtotal;
      totalRevenue += share;
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, {
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
        });
      }
    });
  });

  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.price) * Number(product.quantity),
    0,
  );

  // Stock buckets refined after enrich with committedQuantity (REQ-0140)
  const categoryInsights = computeCatalogInsights(
    products.map((p) => ({
      quantity: p.quantity,
      reservedQuantity: Number(p.reservedQuantity ?? 0),
      orderItems: p.orderItems,
    })),
    totalRevenue,
    orderMap.size,
    totalQuantitySold,
  );

  const allOrderItems = products.flatMap((product) => {
    const owner = toParty(ownerMap.get(product.userId));
    const supplierRow = supplierMap.get(product.supplierId);
    return (product.orderItems || []).map((item) => {
      const order = item.order;
      const orderSubtotal = order?.subtotal ?? 0;
      const orderTotal = order?.total ?? 0;
      const proportionalAmount = computeProportionalLineAmount(
        item.subtotal,
        orderSubtotal,
        orderTotal,
      );
      const buyerId = order
        ? resolveBuyerUserId({
            userId: order.userId,
            clientId: order.clientId,
          })
        : null;
      const placedBy = buyerId ? toParty(orderUserMap.get(buyerId)) : null;
      return {
        id: item.id,
        orderId: order?.id || "",
        orderNumber: order?.orderNumber || "",
        orderStatus: order?.status || "",
        paymentStatus: order?.paymentStatus ?? undefined,
        statusAt: order ? resolveOrderStatusAtFromSource(order) : undefined,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImageUrl: product.imageUrl || null,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        proportionalAmount,
        orderTotal,
        orderDate: (order?.createdAt || item.createdAt).toISOString(),
        createdAt: item.createdAt,
        owner,
        placedBy,
        supplier: supplierRow
          ? { id: supplierRow.id, name: supplierRow.name }
          : null,
        // REQ-0143 — category for recent-order meta line
        category: { id: category.id, name: category.name },
      };
    });
  });

  const recentOrders = allOrderItems
    .sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA;
    })
    .slice(0, 10)
    .map(({ createdAt: _c, supplier: _s, ...row }) => row);

  return {
    id: category.id,
    name: category.name,
    status: category.status,
    description: category.description || null,
    notes: category.notes || null,
    userId: category.userId,
    createdBy: category.createdBy,
    updatedBy: category.updatedBy || null,
    creator: toParty(creatorUser),
    updater: toParty(updaterUser),
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt?.toISOString() || null,
    statistics: {
      totalProducts,
      totalQuantitySold,
      totalRevenue,
      uniqueOrders: orderMap.size,
      totalValue,
    },
    categoryInsights,
    products: products.map((product) => {
      const owner = toParty(ownerMap.get(product.userId));
      const supplierRow = supplierMap.get(product.supplierId);
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price),
        quantity: Number(product.quantity),
        reservedQuantity: Number(product.reservedQuantity ?? 0),
        status: product.status,
        imageUrl: product.imageUrl || null,
        owner,
        supplier: supplierRow
          ? { id: supplierRow.id, name: supplierRow.name }
          : null,
        // REQ-0141 — grid category link (this detail's category)
        category: { id: category.id, name: category.name },
      };
    }),
    recentOrders,
  };
}

type TransformCategoryDetail = ReturnType<typeof transformCategoryDetail>;

export type CategoryDetailForPage = Omit<TransformCategoryDetail, "products"> & {
  products: Array<
    TransformCategoryDetail["products"][number] & { committedQuantity: number }
  >;
};

function categoryDetailCacheValid(
  cached: CategoryDetailForPage | null | undefined,
): cached is CategoryDetailForPage {
  return (
    !!cached &&
    cached.products.every((p) => typeof p.committedQuantity === "number")
  );
}

/** Role-scoped category detail for page SSR — null when not found or unauthorized. */
export async function getCategoryDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<CategoryDetailForPage | null> {
  const userId = session.id;
  const isAdmin = session.role === "admin";
  const isClient = session.role === "client";
  const isSupplier = session.role === "supplier";

  const supplierEntity = isSupplier
    ? await resolveSupplierEntityForSession(userId)
    : null;
  if (isSupplier && !supplierEntity) return null;

  const cacheScope = catalogDetailCacheScope(session, supplierEntity?.id);
  const cacheKey = cacheKeys.categories.detail(id, cacheScope);
  const cacheReadStartedAt = Date.now();
  const cachedCategory = await getCache<CategoryDetailForPage>(cacheKey);
  if (categoryDetailCacheValid(cachedCategory)) {
    logger.info(`✅ Cache hit for category: ${cacheKey}`);
    return cachedCategory;
  }

  logger.info(`❌ Cache miss for category: ${cacheKey} - fetching from database`);

  let category: Awaited<ReturnType<typeof getCategoryById>> | null;

  if (isAdmin || isClient) {
    category = await prisma.category.findUnique({ where: { id } });
  } else if (isSupplier && supplierEntity) {
    category = await prisma.category.findUnique({ where: { id } });
    if (!category) return null;
    const allowed = await supplierCanAccessCategory(id, supplierEntity.id);
    if (!allowed) return null;
  } else {
    category = await getCategoryById(id, userId);
  }

  if (!category) return null;

  const products = await prisma.product.findMany({
    where: mergeProductListWhere({
      categoryId: category.id,
      ...(isClient
        ? {}
        : isSupplier && supplierEntity
          ? { supplierId: supplierEntity.id }
          : { userId }),
    }),
    include: {
      orderItems: {
        include: {
            order: {
              select: catalogDetailOrderSelect,
            },
        },
      },
    },
  });

  const ownerIds = [...new Set(products.map((p) => p.userId))];
  const supplierIds = [...new Set(products.map((p) => p.supplierId))];
  const orderUserIds = [
    ...new Set(
      products.flatMap((p) =>
        (p.orderItems ?? []).flatMap((item) => {
          const o = item.order;
          if (!o?.userId) return [];
          return [
            o.userId,
            resolveBuyerUserId({ userId: o.userId, clientId: o.clientId }),
          ];
        }),
      ),
    ),
  ];

  const [creatorUser, updaterUser, owners, suppliers, orderUsers] =
    await Promise.all([
      category.createdBy
        ? prisma.user.findUnique({
            where: { id: category.createdBy },
            select: { id: true, email: true, name: true, image: true },
          })
        : null,
      category.updatedBy
        ? prisma.user.findUnique({
            where: { id: category.updatedBy },
            select: { id: true, email: true, name: true, image: true },
          })
        : null,
      ownerIds.length
        ? prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, email: true, name: true, image: true },
          })
        : [],
      supplierIds.length
        ? prisma.supplier.findMany({
            where: { id: { in: supplierIds } },
            select: { id: true, name: true },
          })
        : [],
      orderUserIds.length
        ? prisma.user.findMany({
            where: { id: { in: orderUserIds } },
            select: { id: true, email: true, name: true, image: true },
          })
        : [],
    ]);

  const ownerMap = new Map(owners.map((u) => [u.id, u]));
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
  const orderUserMap = new Map(orderUsers.map((u) => [u.id, u]));

  const transformedCategory = transformCategoryDetail(
    category,
    products,
    creatorUser,
    updaterUser,
    ownerMap,
    supplierMap,
    orderUserMap,
  );

  const enrichedProducts = await enrichProductsWithCommittedQuantity(
    transformedCategory.products,
  );

  // REQ-0140 — insights stock buckets use qty − committed (alloc + product reserved)
  const committedById = new Map(
    enrichedProducts.map((p) => [p.id, p.committedQuantity]),
  );
  const categoryInsights = computeCatalogInsights(
    products.map((p) => ({
      quantity: p.quantity,
      reservedQuantity: Number(p.reservedQuantity ?? 0),
      committedQuantity: committedById.get(p.id) ?? 0,
      orderItems: p.orderItems,
    })),
    transformedCategory.statistics.totalRevenue,
    transformedCategory.statistics.uniqueOrders,
    transformedCategory.statistics.totalQuantitySold,
  );

  // REQ-0143 — batch invoice links for recent-order indicators
  const invoiceMap = await getInvoiceLinkMap(
    transformedCategory.recentOrders.map((o) => o.orderId).filter(Boolean),
  );
  const recentOrders = transformedCategory.recentOrders.map((o) => {
    const inv = invoiceMap.get(o.orderId);
    return {
      ...o,
      invoiceForOrder: inv
        ? { id: inv.id, invoiceNumber: inv.invoiceNumber }
        : null,
    };
  });

  const categoryForPage: CategoryDetailForPage = {
    ...transformedCategory,
    categoryInsights,
    products: enrichedProducts,
    recentOrders,
  };

  await setCache(cacheKey, categoryForPage, 300, { fetchedAt: cacheReadStartedAt });
  return categoryForPage;
}
