/**
 * Server-side data for Admin Supplier Portal page
 * Aggregates Supplier entities for this admin (own + Demo Supplier), their products, and related orders.
 * Only import from server code (e.g. app/admin/supplier-portal/page.tsx, GET /api/supplier-portal).
 * REQ-0177 — denser recent product/order catalog meta + Redis shape guard.
 * REQ-0178 — recent orders buyer (placedBy*) + Redis v4.
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { enrichProductsWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { orderStatusAtSelect } from "@/lib/server/catalog-detail-order-select";
import { withOrderStatusAt } from "@/lib/orders/order-status-display-date";
import { resolveBuyerDisplayFromUsers } from "@/lib/orders/order-party";
import { getSuppliersForAdminIncludingDemo } from "@/prisma/supplier";
import type {
  SupplierPortalStats,
  SupplierPortalCounts,
  SupplierPortalRecentProduct,
  SupplierPortalRecentOrder,
  SupplierPortalSupplier,
} from "@/types";

/** REQ-0177/0178 — reject stale Redis missing catalog + placedBy fields. */
function hasSupplierPortalCatalogMeta(stats: SupplierPortalStats): boolean {
  const products = stats.recentProducts ?? [];
  if (
    products.length > 0 &&
    !products.every((p) => "categoryId" in p && "committedQuantity" in p)
  ) {
    return false;
  }
  const orders = stats.recentOrders ?? [];
  if (
    orders.length > 0 &&
    !orders.every(
      (o) =>
        "productPreview" in o && "categoryId" in o && "placedById" in o,
    )
  ) {
    return false;
  }
  return true;
}

/**
 * @param adminUserId - Current admin user id. Only their suppliers + Demo Supplier are included (same as sidebar badge and GET /api/suppliers).
 */
export async function getSupplierPortalForAdmin(
  adminUserId: string,
): Promise<SupplierPortalStats> {
  const cacheKey = cacheKeys.supplierPortal.overview(adminUserId);
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<SupplierPortalStats>(cacheKey);
  if (cached && hasSupplierPortalCatalogMeta(cached)) return cached;

  // Only suppliers this admin can see: own + Demo Supplier (same as sidebar badge)
  const supplierEntities = await getSuppliersForAdminIncludingDemo(adminUserId);

  const supplierUserIds = [...new Set(supplierEntities.map((s) => s.userId))];
  const supplierUserMap = new Map<
    string,
    { email: string; image: string | null }
  >();
  if (supplierUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: supplierUserIds } },
      select: { id: true, email: true, image: true },
    });
    users.forEach((u) =>
      supplierUserMap.set(u.id, { email: u.email, image: u.image }),
    );
  }

  const supplierIds = supplierEntities.map((s) => s.id);
  const supplierMap = new Map(
    supplierEntities.map((s) => [
      s.id,
      { id: s.id, name: s.name, userId: s.userId, createdAt: s.createdAt },
    ]),
  );

  // Get products for those suppliers
  const products = supplierIds.length
    ? await prisma.product.findMany({
        where: mergeProductListWhere({ supplierId: { in: supplierIds } }),
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          quantity: true,
          reservedQuantity: true,
          status: true,
          supplierId: true,
          categoryId: true,
          imageUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Get orders containing products from these suppliers
  const productIds = products.map((p) => p.id);
  const orderItems = productIds.length
    ? await prisma.orderItem.findMany({
        where: { productId: { in: productIds } },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          price: true,
          orderId: true,
          product: {
            select: {
              imageUrl: true,
              categoryId: true,
            },
          },
        },
      })
    : [];

  // Get orders for these items (REQ-0178 — userId/clientId for buyer row)
  const orderIds = [...new Set(orderItems.map((oi) => oi.orderId))];
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          userId: true,
          clientId: true,
          createdAt: true,
          ...orderStatusAtSelect,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Map productId -> supplierId
  const productSupplierMap = new Map(products.map((p) => [p.id, p.supplierId]));
  const productById = new Map(products.map((p) => [p.id, p]));

  // Map orderId -> primary supplierId (first item supplier) + first item meta
  const orderSupplierMap = new Map<string, string>();
  const orderFirstItemMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      imageUrl: string | null;
      categoryId: string | null;
      itemCount: number;
    }
  >();
  for (const oi of orderItems) {
    if (!orderSupplierMap.has(oi.orderId)) {
      const supplierId = productSupplierMap.get(oi.productId);
      if (supplierId) orderSupplierMap.set(oi.orderId, supplierId);
    }
    const prev = orderFirstItemMap.get(oi.orderId);
    if (!prev) {
      orderFirstItemMap.set(oi.orderId, {
        productId: oi.productId,
        productName: oi.productName,
        imageUrl: oi.product?.imageUrl ?? null,
        categoryId: oi.product?.categoryId ?? null,
        itemCount: 1,
      });
    } else {
      prev.itemCount += 1;
    }
  }

  // Category names for recent products + order first items
  const categoryIds = [
    ...new Set(
      [
        ...products.slice(0, 10).map((p) => p.categoryId),
        ...[...orderFirstItemMap.values()].map((i) => i.categoryId),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const cats = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    cats.forEach((c) => categoryMap.set(c.id, c.name));
  }

  // Counts
  const totalProductValue = products.reduce(
    (sum, p) => sum + p.price * Number(p.quantity),
    0,
  );
  const counts: SupplierPortalCounts = {
    suppliers: supplierEntities.length,
    products: products.length,
    orders: orders.length,
    totalValue: totalProductValue,
  };

  // Recent products (last 10) — REQ-0177 category + committedQuantity
  const recentSlice = products.slice(0, 10);
  const recentEnriched = await enrichProductsWithCommittedQuantity(
    recentSlice.map((p) => ({
      id: p.id,
      reservedQuantity: Number(p.reservedQuantity ?? 0),
    })),
  );
  const committedById = new Map(
    recentEnriched.map((p) => [p.id, p.committedQuantity]),
  );

  const recentProducts: SupplierPortalRecentProduct[] = recentSlice.map(
    (p) => {
      const supplier = supplierMap.get(p.supplierId);
      const supplierUserId = supplier?.userId ?? null;
      const categoryId = p.categoryId ?? null;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        quantity: Number(p.quantity),
        reservedQuantity: Number(p.reservedQuantity ?? 0),
        committedQuantity: committedById.get(p.id) ?? 0,
        status: p.status,
        supplierId: p.supplierId,
        supplierName: supplier?.name ?? "Unknown",
        imageUrl: p.imageUrl ?? null,
        supplierUserId,
        supplierImage: supplierUserId
          ? (supplierUserMap.get(supplierUserId)?.image ?? null)
          : null,
        categoryId,
        categoryName: categoryId ? (categoryMap.get(categoryId) ?? null) : null,
        createdAt: p.createdAt.toISOString(),
      };
    },
  );

  // Recent orders (last 10) — REQ-0177 product meta + REQ-0178 buyer
  const recentOrderSlice = orders.slice(0, 10);
  const buyerIds = [
    ...new Set(
      recentOrderSlice
        .map((o) => o.clientId ?? o.userId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  type BuyerUserRow = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  const buyerUserMap = new Map<string, BuyerUserRow>();
  if (buyerIds.length > 0) {
    const buyerUsers = await prisma.user.findMany({
      where: { id: { in: buyerIds } },
      select: { id: true, name: true, email: true, image: true },
    });
    buyerUsers.forEach((u) => buyerUserMap.set(u.id, u));
  }

  const recentOrders: SupplierPortalRecentOrder[] = recentOrderSlice.map(
    (o) => {
      const supplierId = orderSupplierMap.get(o.id) ?? "";
      const supplier = supplierMap.get(supplierId);
      const supplierUserId = supplier?.userId ?? null;
      const first = orderFirstItemMap.get(o.id);
      const extraItemCount = first ? Math.max(0, first.itemCount - 1) : 0;
      const productPreview = first?.productName
        ? extraItemCount > 0
          ? `${first.productName} +${extraItemCount}`
          : first.productName
        : null;
      const categoryId = first?.categoryId ?? null;
      // Prefer live product image when still in catalog map
      const liveProduct = first ? productById.get(first.productId) : undefined;
      const buyer = resolveBuyerDisplayFromUsers(
        { userId: o.userId, clientId: o.clientId },
        buyerUserMap,
      );
      const buyerRow = buyerUserMap.get(buyer.userId);
      return withOrderStatusAt({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total ?? 0,
        supplierId,
        supplierName: supplier?.name ?? "Unknown",
        supplierUserId,
        supplierImage: supplierUserId
          ? (supplierUserMap.get(supplierUserId)?.image ?? null)
          : null,
        createdAt: o.createdAt.toISOString(),
        paymentStatus: o.paymentStatus,
        cancelledAt: o.cancelledAt,
        deliveredAt: o.deliveredAt,
        shippedAt: o.shippedAt,
        updatedAt: o.updatedAt,
        invoice: o.invoice,
        productId: first?.productId ?? null,
        productPreview,
        productImageUrl: liveProduct?.imageUrl ?? first?.imageUrl ?? null,
        extraItemCount,
        categoryId,
        categoryName: categoryId
          ? (categoryMap.get(categoryId) ?? null)
          : null,
        placedById: buyer.userId,
        placedByName: buyer.name,
        placedByImage: buyerRow?.image ?? null,
      });
    },
  );

  // Supplier summary (based on Supplier entities; email from linked User via userId)
  const suppliers: SupplierPortalSupplier[] = supplierEntities.map((s) => {
    const supplierProducts = products.filter((p) => p.supplierId === s.id);
    const productIdSet = new Set(supplierProducts.map((p) => p.id));
    const supplierOrderIds = new Set(
      orderItems
        .filter((oi) => productIdSet.has(oi.productId))
        .map((oi) => oi.orderId),
    );
    const totalValue = supplierProducts.reduce(
      (sum, p) => sum + p.price * Number(p.quantity),
      0,
    );
    const email = supplierUserMap.get(s.userId)?.email ?? "—";
    const image = supplierUserMap.get(s.userId)?.image ?? null;

    return {
      id: s.id,
      userId: s.userId,
      name: s.name,
      email,
      image,
      createdAt: s.createdAt.toISOString(),
      productCount: supplierProducts.length,
      orderCount: supplierOrderIds.size,
      totalValue,
    };
  });

  const stats: SupplierPortalStats = {
    counts,
    recentProducts,
    recentOrders,
    suppliers,
  };

  await setCache(cacheKey, stats, 300, { fetchedAt: cacheReadStartedAt });
  return stats;
}
