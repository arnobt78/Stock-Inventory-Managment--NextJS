/**
 * Server-side category detail fetch for SSR prefetch.
 * Mirrors GET /api/categories/:id auth + response shape (includes Redis cache).
 * REQ-0024
 */

import { getCategoryById } from "@/prisma/category";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { logger } from "@/lib/logger";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import {
  catalogDetailCacheScope,
  resolveSupplierEntityForSession,
  supplierCanAccessCategory,
} from "@/lib/server/catalog-entity-access";

function transformCategoryDetail(
  category: NonNullable<Awaited<ReturnType<typeof getCategoryById>>>,
  products: Awaited<
    ReturnType<
      typeof prisma.product.findMany<{
        include: {
          orderItems: {
            include: {
              order: {
                select: {
                  id: true;
                  orderNumber: true;
                  status: true;
                  subtotal: true;
                  total: true;
                  createdAt: true;
                };
              };
            };
          };
        };
      }>
    >
  >,
  creatorUser: { id: string; email: string; name: string | null } | null,
  updaterUser: { id: string; email: string; name: string | null } | null,
) {
  const totalProducts = products.length;
  let totalQuantitySold = 0;
  let totalRevenue = 0;
  const orderMap = new Map<
    string,
    { orderNumber: string; status: string; total: number; createdAt: Date }
  >();

  products.forEach((product) => {
    product.orderItems?.forEach((item) => {
      totalQuantitySold += item.quantity;
      const order = item.order as { subtotal?: number; total: number };
      const orderSubtotal = order.subtotal ?? 0;
      const share =
        orderSubtotal > 0
          ? (item.subtotal / orderSubtotal) * order.total
          : item.subtotal;
      totalRevenue += share;
      if (item.order && !orderMap.has(item.order.id)) {
        orderMap.set(item.order.id, {
          orderNumber: item.order.orderNumber,
          status: item.order.status,
          total: item.order.total,
          createdAt: item.order.createdAt,
        });
      }
    });
  });

  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.price) * Number(product.quantity),
    0,
  );

  const allOrderItems = products.flatMap((product) =>
    (product.orderItems || []).map((item) => {
      const order = item.order as { subtotal?: number; total: number } | null;
      const orderSubtotal = order?.subtotal ?? 0;
      const orderTotal = order?.total ?? 0;
      const proportionalAmount =
        orderSubtotal > 0
          ? (item.subtotal / orderSubtotal) * orderTotal
          : item.subtotal;
      return {
        id: item.id,
        orderId: item.order?.id || "",
        orderNumber: item.order?.orderNumber || "",
        orderStatus: item.order?.status || "",
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        proportionalAmount,
        orderTotal,
        orderDate: item.order?.createdAt || item.createdAt,
        createdAt: item.createdAt,
      };
    }),
  );

  const recentOrders = allOrderItems
    .sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA;
    })
    .slice(0, 10);

  return {
    id: category.id,
    name: category.name,
    status: category.status,
    description: category.description || null,
    notes: category.notes || null,
    userId: category.userId,
    createdBy: category.createdBy,
    updatedBy: category.updatedBy || null,
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
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt?.toISOString() || null,
    statistics: {
      totalProducts,
      totalQuantitySold,
      totalRevenue,
      uniqueOrders: orderMap.size,
      totalValue,
    },
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      status: product.status,
      imageUrl: product.imageUrl || null,
    })),
    recentOrders,
  };
}

export type CategoryDetailForPage = ReturnType<typeof transformCategoryDetail>;

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
  const cachedCategory = await getCache<CategoryDetailForPage>(cacheKey);
  if (cachedCategory) {
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
      },
    },
  });

  const [creatorUser, updaterUser] = await Promise.all([
    category.createdBy
      ? prisma.user.findUnique({
          where: { id: category.createdBy },
          select: { id: true, email: true, name: true },
        })
      : null,
    category.updatedBy
      ? prisma.user.findUnique({
          where: { id: category.updatedBy },
          select: { id: true, email: true, name: true },
        })
      : null,
  ]);

  const transformedCategory = transformCategoryDetail(
    category,
    products,
    creatorUser,
    updaterUser,
  );

  await setCache(cacheKey, transformedCategory, 300);
  return transformedCategory;
}
