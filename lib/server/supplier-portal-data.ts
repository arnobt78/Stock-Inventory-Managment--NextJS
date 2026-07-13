/**
 * Server-side data for Admin Supplier Portal page
 * Aggregates Supplier entities for this admin (own + Demo Supplier), their products, and related orders.
 * Only import from server code (e.g. app/admin/supplier-portal/page.tsx, GET /api/supplier-portal).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { getSuppliersForAdminIncludingDemo } from "@/prisma/supplier";
import type {
  SupplierPortalStats,
  SupplierPortalCounts,
  SupplierPortalRecentProduct,
  SupplierPortalRecentOrder,
  SupplierPortalSupplier,
} from "@/types";

/**
 * @param adminUserId - Current admin user id. Only their suppliers + Demo Supplier are included (same as sidebar badge and GET /api/suppliers).
 */
export async function getSupplierPortalForAdmin(
  adminUserId: string,
): Promise<SupplierPortalStats> {
  const cacheKey = cacheKeys.supplierPortal.overview(adminUserId);
  const cached = await getCache<SupplierPortalStats>(cacheKey);
  if (cached) return cached;

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
    supplierEntities.map((s) => [s.id, { id: s.id, name: s.name, userId: s.userId, createdAt: s.createdAt }]),
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
          status: true,
          supplierId: true,
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
          quantity: true,
          price: true,
          orderId: true,
        },
      })
    : [];

  // Get orders for these items
  const orderIds = [...new Set(orderItems.map((oi) => oi.orderId))];
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Map productId -> supplierId
  const productSupplierMap = new Map(products.map((p) => [p.id, p.supplierId]));

  // Map orderId -> primary supplierId (first item supplier)
  const orderSupplierMap = new Map<string, string>();
  for (const oi of orderItems) {
    if (!orderSupplierMap.has(oi.orderId)) {
      const supplierId = productSupplierMap.get(oi.productId);
      if (supplierId) orderSupplierMap.set(oi.orderId, supplierId);
    }
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

  // Recent products (last 10)
  const recentProducts: SupplierPortalRecentProduct[] = products
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      quantity: Number(p.quantity),
      status: p.status,
      supplierId: p.supplierId,
      supplierName: supplierMap.get(p.supplierId)?.name ?? "Unknown",
      createdAt: p.createdAt.toISOString(),
    }));

  // Recent orders (last 10)
  const recentOrders: SupplierPortalRecentOrder[] = orders
    .slice(0, 10)
    .map((o) => {
      const supplierId = orderSupplierMap.get(o.id) ?? "";
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total ?? 0,
        supplierId,
        supplierName: supplierMap.get(supplierId)?.name ?? "Unknown",
        createdAt: o.createdAt.toISOString(),
      };
    });

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

  await setCache(cacheKey, stats, 300);
  return stats;
}
