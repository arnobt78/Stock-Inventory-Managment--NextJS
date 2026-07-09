/**
 * Client Portal Server-Side Data Fetching
 */

import { prisma } from "@/prisma/client";
import type { ClientPortalDashboard } from "@/types";

/**
 * Get client portal dashboard for a client user
 * Client is identified by their userId being referenced as clientId in orders
 */
export async function getClientDashboard(
  userId: string,
  userName: string,
): Promise<ClientPortalDashboard> {
  // Get orders where this user is the client
  const orders = await prisma.order.findMany({
    where: { clientId: userId },
    include: {
      items: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get invoices for this client (invoices linked to this user as client)
  const invoices = await prisma.invoice.findMany({
    where: { clientId: userId },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = orders.length;
  // Order status counts for fulfillment (Pending, In progress, Shipped, Delivered, Completed, Cancelled)
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const inProgressCount = orders.filter(
    (o) => o.status === "confirmed" || o.status === "processing",
  ).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const completedCount = shippedCount + deliveredCount;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const refundedOrdersCount = orders.filter(
    (o) => o.paymentStatus === "refunded",
  ).length;
  // Payment-based counts (Awaiting Payment, Completed = paid, Cancelled)
  const ordersAwaitingPayment = orders.filter(
    (o) =>
      o.paymentStatus !== "paid" &&
      o.paymentStatus !== "refunded" &&
      o.status !== "cancelled",
  ).length;
  const ordersCompleted = orders.filter(
    (o) => o.paymentStatus === "paid" && o.status !== "cancelled",
  ).length;
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  // Payment breakdown by payment status (for Total Spent card badges)
  const paymentBreakdown = {
    paid: orders
      .filter((o) => o.paymentStatus === "paid" && o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0),
    due: orders
      .filter(
        (o) =>
          o.paymentStatus === "due" ||
          (o.paymentStatus !== "paid" &&
            o.paymentStatus !== "refunded" &&
            o.status !== "cancelled"),
      )
      .reduce((sum, o) => sum + o.total, 0),
    refund: orders
      .filter((o) => o.paymentStatus === "refunded")
      .reduce((sum, o) => sum + o.total, 0),
    pending: orders
      .filter(
        (o) =>
          (o.paymentStatus === "unpaid" ||
            o.paymentStatus === "partial" ||
            o.paymentStatus === "pending") &&
          o.status !== "cancelled",
      )
      .reduce((sum, o) => sum + o.total, 0),
    cancelled: orders
      .filter((o) => o.status === "cancelled")
      .reduce((sum, o) => sum + o.total, 0),
  };

  // Total invoice amount (sum of invoice totals)
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Invoice breakdown by status (for Outstanding card badges)
  const invoiceBreakdown = {
    paid: invoices.filter((inv) => inv.status === "paid").length,
    pending: invoices.filter(
      (inv) => inv.status === "sent" || inv.status === "draft",
    ).length,
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
    cancelled: invoices.filter((inv) => inv.status === "cancelled").length,
    refunded: refundedOrdersCount,
    total: invoices.length,
  };

  // Calculate outstanding amount from invoices
  const outstandingAmount = invoices
    .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + inv.amountDue, 0);

  // Recent orders (last 10)
  const recentOrders = orders.slice(0, 10).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.length,
  }));

  // Recent invoices (last 10)
  const recentInvoices = invoices.slice(0, 10).map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    total: inv.total,
    amountDue: inv.amountDue,
    dueDate: inv.dueDate?.toISOString() ?? null,
  }));

  // Monthly spending (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = new Map<string, { spent: number; orders: number }>();

  for (const order of orders) {
    if (order.createdAt >= sixMonthsAgo) {
      const monthKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { spent: 0, orders: 0 });
      }
      const data = monthlyData.get(monthKey)!;
      data.spent += order.total;
      data.orders += 1;
    }
  }

  const monthlySpending = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      spent: data.spent,
      orders: data.orders,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    clientId: userId,
    clientName: userName,
    totalOrders,
    ordersAwaitingPayment,
    ordersCompleted,
    refundedOrdersCount,
    orderStatusCounts: {
      pending: pendingCount,
      inProgress: inProgressCount,
      shipped: shippedCount,
      delivered: deliveredCount,
      completed: completedCount,
      cancelled: cancelledCount,
    },
    totalSpent,
    outstandingAmount,
    totalInvoiceAmount,
    paymentBreakdown,
    invoiceBreakdown,
    recentOrders,
    recentInvoices,
    monthlySpending,
  };
}
