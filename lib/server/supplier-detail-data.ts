/**
 * Server-side supplier detail fetch for SSR prefetch.
 * Mirrors GET /api/suppliers/:id auth + response shape (includes Redis cache).
 * REQ-0024
 */

import { computeCatalogInsights } from "@/lib/server/catalog-insights";
import { getSupplierById, getDemoSupplierUserId } from "@/prisma/supplier";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { logger } from "@/lib/logger";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import {
  catalogDetailCacheScope,
  resolveSupplierEntityForSession,
  supplierCanAccessSupplierRecord,
} from "@/lib/server/catalog-entity-access";

function transformSupplierDetail(
  supplier: NonNullable<Awaited<ReturnType<typeof getSupplierById>>>,
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
  creatorUser: {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
  } | null,
  updaterUser: {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
  } | null,
  isDemoSupplier: boolean,
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

  const supplierInsights = computeCatalogInsights(
    products,
    totalRevenue,
    orderMap.size,
    totalQuantitySold,
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
    id: supplier.id,
    name: supplier.name,
    status: supplier.status,
    description: supplier.description || null,
    notes: supplier.notes || null,
    userId: supplier.userId,
    createdBy: supplier.createdBy,
    updatedBy: supplier.updatedBy || null,
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
      status: product.status,
      imageUrl: product.imageUrl || null,
    })),
    recentOrders,
    isGlobalDemo: isDemoSupplier,
  };
}

export type SupplierDetailForPage = ReturnType<typeof transformSupplierDetail>;

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
  const cachedSupplier = await getCache<SupplierDetailForPage>(cacheKey);
  if (cachedSupplier) {
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
  ]);

  const transformedSupplier = transformSupplierDetail(
    supplier,
    products,
    creatorUser,
    updaterUser,
    isDemoSupplier,
  );

  await setCache(cacheKey, transformedSupplier, 300);
  return transformedSupplier;
}
