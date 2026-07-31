/**
 * Client Portal Server-Side Data Fetching
 * REQ-0224 — densify recentOrders with product/category/supplier meta
 */

import { prisma } from "@/prisma/client";
import type { ClientPortalDashboard } from "@/types";
import { buildPaymentMoneyStats } from "@/lib/insights/payment-money-stats";
import { withOrderStatusAt } from "@/lib/orders/order-status-display-date";

/**
 * Get client portal dashboard for a client user
 * Client is identified by their userId being referenced as clientId in orders
 */
export async function getClientDashboard(
  userId: string,
  userName: string,
): Promise<ClientPortalDashboard> {
  // Get orders where this user is the client — include items with product densify
  const orders = await prisma.order.findMany({
    where: { clientId: userId },
    include: {
      items: {
        select: {
          id: true,
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
      invoice: { select: { paidAt: true } },
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

  // REQ-0154 — invoice-money partition for Total Spent / Outstanding badges
  const moneyStats = buildPaymentMoneyStats(invoices);
  const paymentBreakdown = {
    paid: moneyStats.paidCollected,
    partial: moneyStats.partialCollected,
    due: moneyStats.dueOutstanding,
    refund: orders
      .filter((o) => o.paymentStatus === "refunded")
      .reduce((sum, o) => sum + o.total, 0),
    pending: moneyStats.pendingUnpaidDue,
    cancelled: orders
      .filter((o) => o.status === "cancelled")
      .reduce((sum, o) => sum + o.total, 0),
  };

  // Total invoice amount (sum of invoice totals)
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Invoice breakdown — Pending excludes mid-pay (partial); Partial is separate
  const invoiceBreakdown = {
    paid: moneyStats.paidInvoiceCount,
    partial: moneyStats.partialInvoiceCount,
    pending: moneyStats.pendingInvoiceCount,
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
    cancelled: invoices.filter((inv) => inv.status === "cancelled").length,
    refunded: refundedOrdersCount,
    total: invoices.length,
  };

  const outstandingAmount = moneyStats.dueOutstanding;

  // REQ-0224 — densify recent orders with product/category/supplier meta
  const recentSlice = orders.slice(0, 10);

  const neededCategoryIds = new Set<string>();
  const neededSupplierIds = new Set<string>();
  for (const o of recentSlice) {
    const first = o.items[0];
    if (first?.product?.categoryId) neededCategoryIds.add(first.product.categoryId);
    if (first?.product?.supplierId) neededSupplierIds.add(first.product.supplierId);
  }

  const [categoryRows, supplierRows] = await Promise.all([
    neededCategoryIds.size > 0
      ? prisma.category.findMany({
          where: { id: { in: [...neededCategoryIds] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    neededSupplierIds.size > 0
      ? prisma.supplier.findMany({
          where: { id: { in: [...neededSupplierIds] } },
          select: { id: true, name: true, userId: true },
        })
      : Promise.resolve([] as { id: string; name: string; userId: string }[]),
  ]);

  const categoryMap = new Map(categoryRows.map((c) => [c.id, c.name]));
  const supplierMap = new Map(supplierRows.map((s) => [s.id, s]));

  // Fetch supplier user images
  const supplierUserIds = [...new Set(supplierRows.map((s) => s.userId).filter(Boolean))];
  const supplierUserImageMap = new Map<string, string | null>();
  if (supplierUserIds.length > 0) {
    const sUsers = await prisma.user.findMany({
      where: { id: { in: supplierUserIds } },
      select: { id: true, image: true },
    });
    sUsers.forEach((u) => supplierUserImageMap.set(u.id, u.image));
  }

  const recentOrders = recentSlice.map((o) => {
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
    const supplierImage = supplier?.userId
      ? (supplierUserImageMap.get(supplier.userId) ?? null)
      : null;
    return withOrderStatusAt({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.length,
      paymentStatus: o.paymentStatus,
      cancelledAt: o.cancelledAt,
      deliveredAt: o.deliveredAt,
      shippedAt: o.shippedAt,
      updatedAt: o.updatedAt,
      invoice: o.invoice,
      productId: first?.productId ?? null,
      productPreview,
      productImageUrl: first?.product?.imageUrl ?? null,
      categoryId,
      categoryName: categoryId ? (categoryMap.get(categoryId) ?? null) : null,
      supplierId,
      supplierName: supplier?.name ?? null,
      supplierImage,
    });
  });

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
