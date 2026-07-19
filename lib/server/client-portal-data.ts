/**
 * Server-side data for Admin Client Portal page
 * Aggregates clients (role=client), their orders, invoices, revenue.
 * REQ-0158: filter by buyer `clientId` (not creator `userId`).
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

export async function getClientPortalForAdmin(): Promise<ClientPortalStats> {
  const cacheKey = cacheKeys.clientPortal.overview;
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ClientPortalStats>(cacheKey);
  if (cached) return cached;

  // Get all client users
  const clientUsers = await prisma.user.findMany({
    where: { role: "client" },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const clientIds = clientUsers.map((u) => u.id);

  // REQ-0158 — buyer field, not store-owner userId
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

  const recentOrders: ClientPortalRecentOrder[] = orders
    .slice(0, 10)
    .map((o) => {
      const buyerId = o.clientId ?? o.userId;
      return withOrderStatusAt({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total ?? 0,
        clientId: buyerId,
        clientName: userMap.get(buyerId)?.name ?? "Unknown",
        createdAt: o.createdAt.toISOString(),
        paymentStatus: o.paymentStatus,
        cancelledAt: o.cancelledAt,
        deliveredAt: o.deliveredAt,
        shippedAt: o.shippedAt,
        updatedAt: o.updatedAt,
        invoice: o.invoice,
      });
    });

  const recentInvoices: ClientPortalRecentInvoice[] = invoices
    .slice(0, 10)
    .map((i) => {
      const buyerId = i.clientId ?? i.userId;
      return {
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        status: i.status,
        total: i.total ?? 0,
        clientId: buyerId,
        clientName: userMap.get(buyerId)?.name ?? "Unknown",
        createdAt: i.createdAt.toISOString(),
      };
    });

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
