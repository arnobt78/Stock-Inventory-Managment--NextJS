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
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import {
  catalogDetailCacheScope,
  resolveSupplierEntityForSession,
  supplierCanAccessSupplierRecord,
} from "@/lib/server/catalog-entity-access";
import type { CatalogPartyUserRow } from "@/lib/server/catalog-party-snapshot";

type SupplierProductWithOrders = Awaited<
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
                userId: true;
              };
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
) {
  const supplierSnapshot = { id: supplier.id, name: supplier.name };
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

  const allOrderItems = products.flatMap((product) => {
    const owner = toParty(ownerMap.get(product.userId));
    return (product.orderItems || []).map((item) => {
      const order = item.order;
      const orderSubtotal = order?.subtotal ?? 0;
      const orderTotal = order?.total ?? 0;
      const proportionalAmount =
        orderSubtotal > 0
          ? (item.subtotal / orderSubtotal) * orderTotal
          : item.subtotal;
      const placedBy = order?.userId
        ? toParty(orderUserMap.get(order.userId))
        : null;
      return {
        id: item.id,
        orderId: order?.id || "",
        orderNumber: order?.orderNumber || "",
        orderStatus: order?.status || "",
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
              userId: true,
            },
          },
        },
      },
    },
  });

  const ownerIds = [...new Set(products.map((p) => p.userId))];
  const orderUserIds = [
    ...new Set(
      products.flatMap((p) =>
        (p.orderItems ?? [])
          .map((item) => item.order?.userId)
          .filter((uid): uid is string => Boolean(uid)),
      ),
    ),
  ];

  const [creatorUser, updaterUser, owners, orderUsers] = await Promise.all([
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
  ]);

  const ownerMap = new Map(owners.map((u) => [u.id, u]));
  const orderUserMap = new Map(orderUsers.map((u) => [u.id, u]));

  const transformedSupplier = transformSupplierDetail(
    supplier,
    products,
    creatorUser,
    updaterUser,
    ownerMap,
    orderUserMap,
    isDemoSupplier,
  );

  await setCache(cacheKey, transformedSupplier, 300);
  return transformedSupplier;
}
