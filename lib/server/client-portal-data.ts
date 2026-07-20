/**
 * Server-side data for Admin Client Portal page
 * Aggregates clients (role=client), their orders, invoices, revenue.
 * REQ-0158: filter by buyer `clientId` (not creator `userId`).
 * REQ-0177 — denser recent order/invoice product meta + Redis v4 shape guard.
 * Only import from server code (e.g. app/admin/client-portal/page.tsx, GET /api/client-portal).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { orderStatusAtSelect } from "@/lib/server/catalog-detail-order-select";
import { withOrderStatusAt } from "@/lib/orders/order-status-display-date";
import type {
  ClientPortalStats,
  ClientPortalCounts,
  ClientPortalRevenue,
  ClientPortalRecentOrder,
  ClientPortalRecentInvoice,
  ClientPortalClient,
} from "@/types";

/** REQ-0177 — reject stale Redis rows missing productPreview on recent orders. */
function hasClientPortalCatalogMeta(stats: ClientPortalStats): boolean {
  const orders = stats.recentOrders ?? [];
  if (
    orders.length > 0 &&
    !orders.every((o) => "productPreview" in o && "categoryId" in o)
  ) {
    return false;
  }
  const invoices = stats.recentInvoices ?? [];
  if (
    invoices.length > 0 &&
    !invoices.every((i) => "productPreview" in i && "categoryId" in i)
  ) {
    return false;
  }
  return true;
}

export async function getClientPortalForAdmin(): Promise<ClientPortalStats> {
  const cacheKey = cacheKeys.clientPortal.overview;
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ClientPortalStats>(cacheKey);
  if (cached && hasClientPortalCatalogMeta(cached)) return cached;

  // Get all client users
  const clientUsers = await prisma.user.findMany({
    where: { role: "client" },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const clientIds = clientUsers.map((u) => u.id);

  // REQ-0158 — buyer field, not store-owner userId (counts / clients table)
  const orders = clientIds.length
    ? await prisma.order.findMany({
        where: { clientId: { in: clientIds } },
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

  const invoices = clientIds.length
    ? await prisma.invoice.findMany({
        where: { clientId: { in: clientIds } },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          userId: true,
          clientId: true,
          orderId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const userMap = new Map(clientUsers.map((u) => [u.id, u]));

  const counts: ClientPortalCounts = {
    clients: clientUsers.length,
    orders: orders.length,
    invoices: invoices.length,
  };

  const ordersRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const invoicesRevenue = invoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
  const revenue: ClientPortalRevenue = {
    orders: ordersRevenue,
    invoices: invoicesRevenue,
  };

  // REQ-0177 — recent 10 with first-line catalog items (dashboard parity)
  const recentOrderRows = clientIds.length
    ? await prisma.order.findMany({
        where: { clientId: { in: clientIds } },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          userId: true,
          clientId: true,
          createdAt: true,
          ...orderStatusAtSelect,
          items: {
            select: {
              productId: true,
              productName: true,
              product: {
                select: {
                  imageUrl: true,
                  categoryId: true,
                  supplierId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  const recentInvoiceSlice = invoices.slice(0, 10);
  const invoiceOrderIds = [
    ...new Set(
      recentInvoiceSlice
        .map((i) => i.orderId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  type FirstItemMeta = {
    productId: string;
    productName: string;
    imageUrl: string | null;
    categoryId: string | null;
    supplierId: string | null;
    itemCount: number;
  };

  const invoiceOrderFirstItem = new Map<string, FirstItemMeta>();
  if (invoiceOrderIds.length > 0) {
    const invItems = await prisma.orderItem.findMany({
      where: { orderId: { in: invoiceOrderIds } },
      select: {
        orderId: true,
        productId: true,
        productName: true,
        product: {
          select: {
            imageUrl: true,
            categoryId: true,
            supplierId: true,
          },
        },
      },
    });
    for (const oi of invItems) {
      const prev = invoiceOrderFirstItem.get(oi.orderId);
      if (!prev) {
        invoiceOrderFirstItem.set(oi.orderId, {
          productId: oi.productId,
          productName: oi.productName,
          imageUrl: oi.product?.imageUrl ?? null,
          categoryId: oi.product?.categoryId ?? null,
          supplierId: oi.product?.supplierId ?? null,
          itemCount: 1,
        });
      } else {
        prev.itemCount += 1;
      }
    }
  }

  // Batch categories + supplier entities/images for recent orders (+ invoice products)
  const categoryIds = new Set<string>();
  const supplierIds = new Set<string>();
  for (const o of recentOrderRows) {
    const first = o.items[0];
    if (first?.product?.categoryId) categoryIds.add(first.product.categoryId);
    if (first?.product?.supplierId) supplierIds.add(first.product.supplierId);
  }
  for (const meta of invoiceOrderFirstItem.values()) {
    if (meta.categoryId) categoryIds.add(meta.categoryId);
    if (meta.supplierId) supplierIds.add(meta.supplierId);
  }

  const [categories, suppliers] = await Promise.all([
    categoryIds.size > 0
      ? prisma.category.findMany({
          where: { id: { in: [...categoryIds] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    supplierIds.size > 0
      ? prisma.supplier.findMany({
          where: { id: { in: [...supplierIds] } },
          select: { id: true, name: true, userId: true },
        })
      : Promise.resolve(
          [] as { id: string; name: string; userId: string }[],
        ),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
  const supplierUserIds = [
    ...new Set(suppliers.map((s) => s.userId).filter(Boolean)),
  ];
  const supplierUserImageMap = new Map<string, string | null>();
  if (supplierUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: supplierUserIds } },
      select: { id: true, image: true },
    });
    users.forEach((u) => supplierUserImageMap.set(u.id, u.image));
  }

  const recentOrders: ClientPortalRecentOrder[] = recentOrderRows.map((o) => {
    const buyerId = o.clientId ?? o.userId;
    const buyer = userMap.get(buyerId);
    const first = o.items[0];
    const extraItemCount = Math.max(0, o.items.length - 1);
    const productPreview = first?.productName
      ? extraItemCount > 0
        ? `${first.productName} +${extraItemCount}`
        : first.productName
      : null;
    const categoryId = first?.product?.categoryId ?? null;
    const supplierId = first?.product?.supplierId ?? null;
    const supplier = supplierId ? supplierMap.get(supplierId) : undefined;
    return withOrderStatusAt({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total ?? 0,
      clientId: buyerId,
      clientName: buyer?.name ?? "Unknown",
      clientImage: buyer?.image ?? null,
      createdAt: o.createdAt.toISOString(),
      paymentStatus: o.paymentStatus,
      cancelledAt: o.cancelledAt,
      deliveredAt: o.deliveredAt,
      shippedAt: o.shippedAt,
      updatedAt: o.updatedAt,
      invoice: o.invoice,
      productId: first?.productId ?? null,
      productPreview,
      productImageUrl: first?.product?.imageUrl ?? null,
      extraItemCount,
      categoryId,
      categoryName: categoryId ? (categoryMap.get(categoryId) ?? null) : null,
      supplierId,
      supplierName: supplier?.name ?? null,
      supplierImage: supplier?.userId
        ? (supplierUserImageMap.get(supplier.userId) ?? null)
        : null,
    });
  });

  const recentInvoices: ClientPortalRecentInvoice[] = recentInvoiceSlice.map(
    (i) => {
      const buyerId = i.clientId ?? i.userId;
      const buyer = userMap.get(buyerId);
      const first = i.orderId
        ? invoiceOrderFirstItem.get(i.orderId)
        : undefined;
      const extraItemCount = first ? Math.max(0, first.itemCount - 1) : 0;
      const productPreview = first?.productName
        ? extraItemCount > 0
          ? `${first.productName} +${extraItemCount}`
          : first.productName
        : null;
      const categoryId = first?.categoryId ?? null;
      return {
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        status: i.status,
        total: i.total ?? 0,
        clientId: buyerId,
        clientName: buyer?.name ?? "Unknown",
        clientImage: buyer?.image ?? null,
        createdAt: i.createdAt.toISOString(),
        productId: first?.productId ?? null,
        productPreview,
        productImageUrl: first?.imageUrl ?? null,
        categoryId,
        categoryName: categoryId
          ? (categoryMap.get(categoryId) ?? null)
          : null,
      };
    },
  );

  const clients: ClientPortalClient[] = clientUsers.map((u) => {
    const userOrders = orders.filter((o) => o.clientId === u.id);
    const userInvoices = invoices.filter((i) => i.clientId === u.id);
    const totalSpent = userOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
      orderCount: userOrders.length,
      invoiceCount: userInvoices.length,
      totalSpent,
    };
  });

  const stats: ClientPortalStats = {
    counts,
    revenue,
    recentOrders,
    recentInvoices,
    clients,
  };

  await setCache(cacheKey, stats, 300, { fetchedAt: cacheReadStartedAt });
  return stats;
}
