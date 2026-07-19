/**
 * Server-side supplier detail fetch for SSR prefetch.
 * Mirrors GET /api/suppliers/:id auth + response shape (includes Redis cache).
 * REQ-0024, REQ-0086 — party enrichment on products + recent orders (category parity).
 */

import { computeCatalogInsights } from "@/lib/server/catalog-insights";
import { toParty } from "@/lib/server/catalog-party-snapshot";
import { getSupplierById, getDemoSupplierUserId } from "@/prisma/supplier";
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
  supplierCanAccessSupplierRecord,
} from "@/lib/server/catalog-entity-access";
import type { CatalogPartyUserRow } from "@/lib/server/catalog-party-snapshot";
import { enrichProductsWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { catalogDetailOrderSelect } from "@/lib/server/catalog-detail-order-select";
import { resolveOrderStatusAtFromSource } from "@/lib/orders/order-status-display-date";
import { resolveBuyerUserId } from "@/lib/orders/order-party";
import { getInvoiceLinkMap } from "@/lib/server/orders-data";

type SupplierProductWithOrders = Awaited<
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

function transformSupplierDetail(
  supplier: NonNullable<Awaited<ReturnType<typeof getSupplierById>>>,
  products: SupplierProductWithOrders[],
  creatorUser: CatalogPartyUserRow | null,
  updaterUser: CatalogPartyUserRow | null,
  ownerMap: Map<string, CatalogPartyUserRow>,
  orderUserMap: Map<string, CatalogPartyUserRow>,
  isDemoSupplier: boolean,
  categoryMap: Map<string, { id: string; name: string }>,
) {
  const supplierSnapshot = { id: supplier.id, name: supplier.name };
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
  const supplierInsights = computeCatalogInsights(
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
        // REQ-0143 — category for recent-order meta line
        category: categoryMap.get(product.categoryId) ?? null,
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
    .map(({ createdAt: _c, ...row }) => row);

  return {
    id: supplier.id,
    name: supplier.name,
    status: supplier.status,
    description: supplier.description || null,
    notes: supplier.notes || null,
    userId: supplier.userId,
    createdBy: supplier.createdBy,
    updatedBy: supplier.updatedBy || null,
    creator: toParty(creatorUser),
    updater: toParty(updaterUser),
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt?.toISOString() || null,
    statistics: {
      totalProducts,
      totalQuantitySold,
      totalRevenue,
      uniqueOrders: orderMap.size,
      totalValue,
    },
    supplierInsights,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      reservedQuantity: Number(product.reservedQuantity ?? 0),
      status: product.status,
      imageUrl: product.imageUrl || null,
      owner: toParty(ownerMap.get(product.userId)),
      supplier: supplierSnapshot,
      // REQ-0141 — category for product grid link
      category: categoryMap.get(product.categoryId) ?? null,
    })),
    recentOrders,
    isGlobalDemo: isDemoSupplier,
  };
}

type TransformSupplierDetail = ReturnType<typeof transformSupplierDetail>;

export type SupplierDetailForPage = Omit<TransformSupplierDetail, "products"> & {
  products: Array<
    TransformSupplierDetail["products"][number] & { committedQuantity: number }
  >;
};

function supplierDetailCacheValid(
  cached: SupplierDetailForPage | null | undefined,
): cached is SupplierDetailForPage {
  return (
    !!cached &&
    cached.products.every((p) => typeof p.committedQuantity === "number")
  );
}

/** Role-scoped supplier detail for page SSR — null when not found or unauthorized. */
export async function getSupplierDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<SupplierDetailForPage | null> {
  const userId = session.id;
  const isAdmin = session.role === "admin";
  const isClient = session.role === "client";
  const isSupplier = session.role === "supplier";

  const supplierEntity = isSupplier
    ? await resolveSupplierEntityForSession(userId)
    : null;
  if (isSupplier && !supplierEntity) return null;
  if (
    isSupplier &&
    supplierEntity &&
    !supplierCanAccessSupplierRecord(id, supplierEntity.id)
  ) {
    return null;
  }

  const cacheScope = catalogDetailCacheScope(session, supplierEntity?.id);
  const cacheKey = cacheKeys.suppliers.detail(id, cacheScope);
  const cacheReadStartedAt = Date.now();
  const cachedSupplier = await getCache<SupplierDetailForPage>(cacheKey);
  if (supplierDetailCacheValid(cachedSupplier)) {
    logger.info(`✅ Cache hit for supplier: ${cacheKey}`);
    return cachedSupplier;
  }

  logger.info(`❌ Cache miss for supplier: ${cacheKey} - fetching from database`);

  let supplier: Awaited<ReturnType<typeof getSupplierById>> | null;
  const demoUserId = await getDemoSupplierUserId();
  if (isAdmin || isClient) {
    supplier = await prisma.supplier.findUnique({ where: { id } });
  } else if (isSupplier && supplierEntity) {
    supplier = await prisma.supplier.findUnique({ where: { id } });
  } else {
    supplier = await getSupplierById(id, userId);
    if (!supplier && demoUserId) {
      const demoSupplier = await prisma.supplier.findFirst({
        where: { id, userId: demoUserId },
      });
      if (demoSupplier) supplier = demoSupplier;
    }
  }

  if (!supplier) return null;

  const isDemoSupplier = demoUserId === supplier.userId;

  const products = await prisma.product.findMany({
    where: mergeProductListWhere({
      supplierId: supplier.id,
      ...(isClient || isDemoSupplier || isSupplier ? {} : { userId }),
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
  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
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

  const [creatorUser, updaterUser, owners, orderUsers, categories] =
    await Promise.all([
      supplier.createdBy
        ? prisma.user.findUnique({
            where: { id: supplier.createdBy },
            select: { id: true, email: true, name: true, image: true },
          })
        : null,
      supplier.updatedBy
        ? prisma.user.findUnique({
            where: { id: supplier.updatedBy },
            select: { id: true, email: true, name: true, image: true },
          })
        : null,
      ownerIds.length
        ? prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, email: true, name: true, image: true },
          })
        : [],
      orderUserIds.length
        ? prisma.user.findMany({
            where: { id: { in: orderUserIds } },
            select: { id: true, email: true, name: true, image: true },
          })
        : [],
      categoryIds.length
        ? prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

  const ownerMap = new Map(owners.map((u) => [u.id, u]));
  const orderUserMap = new Map(orderUsers.map((u) => [u.id, u]));
  const categoryMap = new Map(
    categories.map((c) => [c.id, { id: c.id, name: c.name }]),
  );

  const transformedSupplier = transformSupplierDetail(
    supplier,
    products,
    creatorUser,
    updaterUser,
    ownerMap,
    orderUserMap,
    isDemoSupplier,
    categoryMap,
  );

  const enrichedProducts = await enrichProductsWithCommittedQuantity(
    transformedSupplier.products,
  );

  // REQ-0140 — insights stock buckets use qty − committed (alloc + product reserved)
  const committedById = new Map(
    enrichedProducts.map((p) => [p.id, p.committedQuantity]),
  );
  const supplierInsights = computeCatalogInsights(
    products.map((p) => ({
      quantity: p.quantity,
      reservedQuantity: Number(p.reservedQuantity ?? 0),
      committedQuantity: committedById.get(p.id) ?? 0,
      orderItems: p.orderItems,
    })),
    transformedSupplier.statistics.totalRevenue,
    transformedSupplier.statistics.uniqueOrders,
    transformedSupplier.statistics.totalQuantitySold,
  );

  // REQ-0143 — batch invoice links for recent-order indicators
  const invoiceMap = await getInvoiceLinkMap(
    transformedSupplier.recentOrders.map((o) => o.orderId).filter(Boolean),
  );
  const recentOrders = transformedSupplier.recentOrders.map((o) => {
    const inv = invoiceMap.get(o.orderId);
    return {
      ...o,
      invoiceForOrder: inv
        ? { id: inv.id, invoiceNumber: inv.invoiceNumber }
        : null,
    };
  });

  const supplierForPage: SupplierDetailForPage = {
    ...transformedSupplier,
    supplierInsights,
    products: enrichedProducts,
    recentOrders,
  };

  await setCache(cacheKey, supplierForPage, 300, { fetchedAt: cacheReadStartedAt });
  return supplierForPage;
}
