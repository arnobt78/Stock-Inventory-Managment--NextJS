/**
 * Server-side data for Admin Client Portal page
 * Aggregates clients (role=client), their orders, invoices, revenue.
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

  // Get orders for clients
  const orders = clientIds.length
    ? await prisma.order.findMany({
        where: { userId: { in: clientIds } },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          userId: true,
          createdAt: true,
          ...orderStatusAtSelect,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Get invoices for clients
  const invoices = clientIds.length
    ? await prisma.invoice.findMany({
        where: { userId: { in: clientIds } },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          userId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Build user map
  const userMap = new Map(clientUsers.map((u) => [u.id, u]));

  // Counts
  const counts: ClientPortalCounts = {
    clients: clientUsers.length,
    orders: orders.length,
    invoices: invoices.length,
  };

  // Revenue
  const ordersRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const invoicesRevenue = invoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
  const revenue: ClientPortalRevenue = {
    orders: ordersRevenue,
    invoices: invoicesRevenue,
  };

  // Recent orders (last 10)
  const recentOrders: ClientPortalRecentOrder[] = orders
    .slice(0, 10)
    .map((o) =>
      withOrderStatusAt({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total ?? 0,
        clientId: o.userId,
        clientName: userMap.get(o.userId)?.name ?? "Unknown",
        createdAt: o.createdAt.toISOString(),
        paymentStatus: o.paymentStatus,
        cancelledAt: o.cancelledAt,
        deliveredAt: o.deliveredAt,
        shippedAt: o.shippedAt,
        updatedAt: o.updatedAt,
      }),
    );

  // Recent invoices (last 10)
  const recentInvoices: ClientPortalRecentInvoice[] = invoices
    .slice(0, 10)
    .map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      status: i.status,
      total: i.total ?? 0,
      clientId: i.userId,
      clientName: userMap.get(i.userId)?.name ?? "Unknown",
      createdAt: i.createdAt.toISOString(),
    }));

  // Client summary
  const clients: ClientPortalClient[] = clientUsers.map((u) => {
    const userOrders = orders.filter((o) => o.userId === u.id);
    const userInvoices = invoices.filter((i) => i.userId === u.id);
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

  await setCache(cacheKey, stats, 300);
  return stats;
}
