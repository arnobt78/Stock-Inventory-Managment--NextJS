/**
 * Server-side product detail fetch for SSR prefetch.
 * Mirrors GET /api/products/:id auth + response shape (includes Redis cache).
 * REQ-0024, REQ-0105 — committedQuantity display field (disjoint paths summed).
 */

import { getSupplierByUserId } from "@/prisma/supplier";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { enrichProductDetailWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { logger } from "@/lib/logger";
import { computeProportionalLineAmount } from "@/lib/orders/proportional-line-amount";
import { isOrderRecordCountedAsSold } from "@/lib/orders/order-sales-eligibility";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import { computeProductInsights } from "@/lib/server/product-insights";
import { catalogDetailOrderSelect } from "@/lib/server/catalog-detail-order-select";
import { resolveOrderStatusAtFromSource } from "@/lib/orders/order-status-display-date";
import { resolveBuyerUserId } from "@/lib/orders/order-party";
import { getInvoiceLinkMap } from "@/lib/server/orders-data";

const productInclude = {
  orderItems: {
    include: {
      order: {
        select: catalogDetailOrderSelect,
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

type ProductWithOrders = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.product.findFirst<{
        include: typeof productInclude;
      }>
    >
  >
>;

function transformProductDetail(
  product: ProductWithOrders,
  category: {
    id: string;
    name: string;
    description: string | null;
    status: boolean;
  } | null,
  supplier: {
    id: string;
    name: string;
    description: string | null;
    status: boolean;
    email?: string | null;
  } | null,
  creatorUser: { id: string; email: string; name: string | null; image?: string | null } | null,
  updaterUser: { id: string; email: string; name: string | null; image?: string | null } | null,
  orderUserMap: Map<
    string,
    { id: string; name: string | null; email: string; image?: string | null }
  >,
  ownerUser: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null,
) {
  const orderItems = product.orderItems || [];
  // REQ-0140 — sold stats = delivered or paid only (not pending reservations)
  const soldItems = orderItems.filter((item) =>
    isOrderRecordCountedAsSold(item.order),
  );
  const totalQuantitySold = soldItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const totalRevenue = soldItems.reduce((sum, item) => {
    const order = item.order as { subtotal?: number; total: number };
    const orderSubtotal = order.subtotal ?? 0;
    const share =
      orderSubtotal > 0
        ? (item.subtotal / orderSubtotal) * order.total
        : item.subtotal;
    return sum + share;
  }, 0);
  const uniqueOrders = new Set(soldItems.map((item) => item.orderId)).size;

  const insightOrderItems = orderItems.map((item) => ({
    quantity: item.quantity,
    subtotal: item.subtotal,
    orderId: item.orderId,
    order: item.order
      ? {
          createdAt: item.order.createdAt,
          subtotal: item.order.subtotal,
          total: item.order.total,
          status: item.order.status,
          paymentStatus: item.order.paymentStatus,
        }
      : null,
  }));

  // Stock buckets refined after enrich with committedQuantity (REQ-0140)
  const productInsights = computeProductInsights(
    Number(product.quantity),
    insightOrderItems,
    null,
    Number(product.reservedQuantity ?? 0),
  );

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price),
    quantity: Number(product.quantity),
    reservedQuantity: Number(product.reservedQuantity ?? 0),
    status: product.status,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    category: category
      ? {
          id: category.id,
          name: category.name,
          description: category.description,
          status: category.status,
        }
      : null,
    supplier: supplier
      ? {
          id: supplier.id,
          name: supplier.name,
          description: supplier.description,
          status: supplier.status,
          email: supplier.email ?? null,
        }
      : null,
    userId: product.userId,
    createdBy: product.createdBy,
    updatedBy: product.updatedBy || null,
    creator: creatorUser
      ? {
          id: creatorUser.id,
          email: creatorUser.email,
          name: creatorUser.name,
          image: creatorUser.image ?? null,
        }
      : null,
    updater: updaterUser
      ? {
          id: updaterUser.id,
          email: updaterUser.email,
          name: updaterUser.name,
          image: updaterUser.image ?? null,
        }
      : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt?.toISOString() || null,
    qrCodeUrl: product.qrCodeUrl || null,
    qrCodeFileId: product.qrCodeFileId || null,
    imageUrl: product.imageUrl || null,
    imageFileId: product.imageFileId || null,
    expirationDate: product.expirationDate?.toISOString() || null,
    statistics: {
      totalQuantitySold,
      totalRevenue,
      uniqueOrders,
      totalValue: Number(product.price) * Number(product.quantity),
    },
    productInsights,
    recentOrders: orderItems.slice(0, 10).map((item) => {
      const order = item.order as {
        subtotal?: number;
        total: number;
        userId?: string;
        clientId?: string | null;
      };
      const orderSubtotal = order.subtotal ?? 0;
      const proportionalAmount = computeProportionalLineAmount(
        item.subtotal,
        orderSubtotal,
        order.total,
      );
      const placedByUserId = order.userId
        ? resolveBuyerUserId({
            userId: order.userId,
            clientId: order.clientId,
          })
        : undefined;
      const placedBy = placedByUserId
        ? orderUserMap.get(placedByUserId)
        : undefined;
      return {
        id: item.id,
        orderId: item.order.id,
        orderNumber: item.order.orderNumber,
        orderStatus: item.order.status,
        paymentStatus: item.order.paymentStatus ?? undefined,
        statusAt: resolveOrderStatusAtFromSource(item.order),
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        proportionalAmount,
        orderTotal: order.total,
        orderDate: item.order.createdAt.toISOString(),
        // REQ-0143 — category + owner for recent-order meta parity
        category: category
          ? { id: category.id, name: category.name }
          : null,
        owner: ownerUser
          ? {
              id: ownerUser.id,
              name: ownerUser.name,
              email: ownerUser.email,
              image: ownerUser.image ?? null,
            }
          : null,
        placedBy: placedBy
          ? {
              id: placedBy.id,
              name: placedBy.name,
              email: placedBy.email,
              image: placedBy.image ?? null,
            }
          : null,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImageUrl: product.imageUrl || null,
      };
    }),
  };
}

export type ProductDetailForPage = ReturnType<typeof transformProductDetail> & {
  /** REQ-0105 — display-only; ProductFormDialog uses raw reservedQuantity + allocation rows */
  committedQuantity: number;
};

function productDetailCacheValid(
  cached: ProductDetailForPage | null | undefined,
): cached is ProductDetailForPage {
  return !!cached && typeof cached.committedQuantity === "number";
}

/** Role-scoped product detail for page SSR — null when not found or unauthorized. */
export async function getProductDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<ProductDetailForPage | null> {
  const userId = session.id;
  const isAdmin = session.role === "admin";
  const isSupplier = session.role === "supplier";
  const isClient = session.role === "client";

  const cacheKey = cacheKeys.products.detail(id);
  const cacheReadStartedAt = Date.now();
  const cachedProduct = await getCache<ProductDetailForPage>(cacheKey);
  if (productDetailCacheValid(cachedProduct)) {
    logger.info(`✅ Cache hit for product: ${cacheKey}`);
    return cachedProduct;
  }

  logger.info(`❌ Cache miss for product: ${cacheKey} - fetching from database`);

  let product: ProductWithOrders | null;
  if (isAdmin) {
    product = await prisma.product.findFirst({
      where: mergeProductListWhere({ id }),
      include: productInclude,
    });
  } else if (isSupplier) {
    const supplier = await getSupplierByUserId(userId);
    if (!supplier) return null;
    product = await prisma.product.findFirst({
      where: mergeProductListWhere({ id, supplierId: supplier.id }),
      include: productInclude,
    });
  } else if (isClient) {
    product = await prisma.product.findFirst({
      where: mergeProductListWhere({ id }),
      include: productInclude,
    });
  } else {
    product = await prisma.product.findFirst({
      where: mergeProductListWhere({ id, userId }),
      include: productInclude,
    });
  }

  if (!product) return null;

  const orderUserIds = [
    ...new Set(
      (product.orderItems ?? []).flatMap((item) => {
        const o = item.order;
        if (!o?.userId) return [];
        return [
          o.userId,
          resolveBuyerUserId({
            userId: o.userId,
            clientId: o.clientId,
          }),
        ];
      }),
    ),
  ] as string[];

  const [category, supplier, creatorUser, updaterUser, orderUsers, ownerUser] =
    await Promise.all([
    prisma.category.findUnique({
      where: { id: product.categoryId },
      select: { id: true, name: true, description: true, status: true },
    }),
    prisma.supplier.findUnique({
      where: { id: product.supplierId },
      select: { id: true, name: true, description: true, status: true, userId: true },
    }),
    product.createdBy
      ? prisma.user.findUnique({
          where: { id: product.createdBy },
          select: { id: true, email: true, name: true, image: true },
        })
      : null,
    product.updatedBy
      ? prisma.user.findUnique({
          where: { id: product.updatedBy },
          select: { id: true, email: true, name: true, image: true },
        })
      : null,
    orderUserIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: orderUserIds } },
          select: { id: true, email: true, name: true, image: true },
        })
      : Promise.resolve([]),
    prisma.user.findUnique({
      where: { id: product.userId },
      select: { id: true, email: true, name: true, image: true },
    }),
  ]);

  const orderUserMap = new Map(
    orderUsers.map((u) => [
      u.id,
      { id: u.id, name: u.name, email: u.email, image: u.image },
    ]),
  );

  const supplierUser = supplier?.userId
    ? await prisma.user.findUnique({
        where: { id: supplier.userId },
        select: { email: true },
      })
    : null;

  const transformedProduct = transformProductDetail(
    product,
    category,
    supplier
      ? { ...supplier, email: supplierUser?.email ?? null }
      : null,
    creatorUser,
    updaterUser,
    orderUserMap,
    ownerUser,
  );

  const enrichedProduct =
    await enrichProductDetailWithCommittedQuantity(transformedProduct);

  // REQ-0143 — batch invoice links for recent-order indicators
  const invoiceMap = await getInvoiceLinkMap(
    enrichedProduct.recentOrders.map((o) => o.orderId).filter(Boolean),
  );
  enrichedProduct.recentOrders = enrichedProduct.recentOrders.map((o) => {
    const inv = invoiceMap.get(o.orderId);
    return {
      ...o,
      invoiceForOrder: inv
        ? { id: inv.id, invoiceNumber: inv.invoiceNumber }
        : null,
    };
  });

  // REQ-0140 — reclassify insights stock using full committed (product + alloc reserved)
  const productInsights = computeProductInsights(
    enrichedProduct.quantity,
    (product.orderItems ?? []).map((item) => ({
      quantity: item.quantity,
      subtotal: item.subtotal,
      orderId: item.orderId,
      order: item.order
        ? {
            createdAt: item.order.createdAt,
            subtotal: item.order.subtotal,
            total: item.order.total,
            status: item.order.status,
            paymentStatus: item.order.paymentStatus,
          }
        : null,
    })),
    null,
    enrichedProduct.committedQuantity,
  );

  const productForPage = { ...enrichedProduct, productInsights };

  await setCache(cacheKey, productForPage, 300, { fetchedAt: cacheReadStartedAt });
  return productForPage;
}
