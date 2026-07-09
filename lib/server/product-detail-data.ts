/**
 * Server-side product detail fetch for SSR prefetch.
 * Mirrors GET /api/products/:id auth + response shape (includes Redis cache).
 * REQ-0024
 */

import { getProductById } from "@/prisma/product";
import { getSupplierByUserId } from "@/prisma/supplier";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { logger } from "@/lib/logger";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

const productInclude = {
  orderItems: {
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          total: true,
          createdAt: true,
        },
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
  } | null,
  creatorUser: { id: string; email: string; name: string | null } | null,
  updaterUser: { id: string; email: string; name: string | null } | null,
) {
  const orderItems = product.orderItems || [];
  const totalQuantitySold = orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const totalRevenue = orderItems.reduce((sum, item) => {
    const order = item.order as { subtotal?: number; total: number };
    const orderSubtotal = order.subtotal ?? 0;
    const share =
      orderSubtotal > 0
        ? (item.subtotal / orderSubtotal) * order.total
        : item.subtotal;
    return sum + share;
  }, 0);
  const uniqueOrders = new Set(orderItems.map((item) => item.orderId)).size;

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
        }
      : null,
    updater: updaterUser
      ? {
          id: updaterUser.id,
          email: updaterUser.email,
          name: updaterUser.name,
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
    recentOrders: orderItems.slice(0, 10).map((item) => {
      const order = item.order as { subtotal?: number; total: number };
      const orderSubtotal = order.subtotal ?? 0;
      const proportionalAmount =
        orderSubtotal > 0
          ? (item.subtotal / orderSubtotal) * order.total
          : item.subtotal;
      return {
        id: item.id,
        orderId: item.order.id,
        orderNumber: item.order.orderNumber,
        orderStatus: item.order.status,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        proportionalAmount,
        orderTotal: order.total,
        orderDate: item.order.createdAt.toISOString(),
      };
    }),
  };
}

export type ProductDetailForPage = ReturnType<typeof transformProductDetail>;

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
  const cachedProduct = await getCache<ProductDetailForPage>(cacheKey);
  if (cachedProduct) {
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
    product = await getProductById(id, userId);
  }

  if (!product) return null;

  const [category, supplier, creatorUser, updaterUser] = await Promise.all([
    prisma.category.findUnique({
      where: { id: product.categoryId },
      select: { id: true, name: true, description: true, status: true },
    }),
    prisma.supplier.findUnique({
      where: { id: product.supplierId },
      select: { id: true, name: true, description: true, status: true },
    }),
    product.createdBy
      ? prisma.user.findUnique({
          where: { id: product.createdBy },
          select: { id: true, email: true, name: true },
        })
      : null,
    product.updatedBy
      ? prisma.user.findUnique({
          where: { id: product.updatedBy },
          select: { id: true, email: true, name: true },
        })
      : null,
  ]);

  const transformedProduct = transformProductDetail(
    product,
    category,
    supplier,
    creatorUser,
    updaterUser,
  );

  await setCache(cacheKey, transformedProduct, 300);
  return transformedProduct;
}
