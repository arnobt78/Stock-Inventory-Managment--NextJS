/**
 * Supplier Portal Server-Side Data Fetching
 */

import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import {
  batchSumAllocationReserved,
  computeCommittedQuantity,
} from "@/lib/products/enrich-product-committed-quantity";
import { withOrderStatusAt } from "@/lib/orders/order-status-display-date";
import { orderStatusAtSelect } from "@/lib/server/catalog-detail-order-select";
import type { SupplierPortalDashboard } from "@/types";

/**
 * Get supplier portal dashboard for a supplier user
 * The user.id should be linked to a supplier entity (same userId in Supplier table)
 */
export async function getSupplierDashboard(
  userId: string,
): Promise<SupplierPortalDashboard | null> {
  // Find supplier linked to this user
  const supplier = await prisma.supplier.findFirst({
    where: { userId },
  });

  if (!supplier) {
    return null;
  }

  // Get products from this supplier
  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ supplierId: supplier.id }),
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      reservedQuantity: true,
      status: true,
      price: true,
    },
  });

  const productIds = products.map((p) => p.id);
  const allocationReservedByProduct = await batchSumAllocationReserved(productIds);

  const productCommitted = (productId: string, productReserved: number) =>
    computeCommittedQuantity(
      productReserved,
      allocationReservedByProduct.get(productId) ?? 0,
    );

  // Get orders containing products from this supplier (include subtotal for revenue attribution)
  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          total: true,
          createdAt: true,
          items: { select: { id: true } },
          ...orderStatusAtSelect,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build unique orders map with supplier's portion of order total (includes tax, shipping, discount)
  const ordersMap = new Map<
    string,
    {
      id: string;
      orderNumber: string;
      status: string;
      paymentStatus: string;
      subtotal: number;
      total: number;
      createdAt: Date;
      productCount: number;
      supplierSubtotal: number;
      cancelledAt: Date | null;
      deliveredAt: Date | null;
      shippedAt: Date | null;
      updatedAt: Date | null;
      invoice: { paidAt: Date | null } | null;
    }
  >();

  for (const item of orderItems) {
    const order = item.order;
    if (!ordersMap.has(order.id)) {
      ordersMap.set(order.id, {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus ?? "unpaid",
        subtotal: order.subtotal ?? 0,
        total: order.total ?? 0,
        createdAt: order.createdAt,
        productCount: order.items.length,
        supplierSubtotal: item.subtotal,
        cancelledAt: order.cancelledAt,
        deliveredAt: order.deliveredAt,
        shippedAt: order.shippedAt,
        updatedAt: order.updatedAt,
        invoice: order.invoice,
      });
    } else {
      const existing = ordersMap.get(order.id)!;
      existing.supplierSubtotal += item.subtotal;
    }
  }

  const orders = Array.from(ordersMap.values());
  const totalOrders = orders.length;
  // Pending = orders not yet paid (status "pending")
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  // Order status counts (Pending, In progress, Shipped, Delivered, Refunded, Cancelled)
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const inProgressCount = orders.filter(
    (o) => o.status === "confirmed" || o.status === "processing",
  ).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const refundedCount = orders.filter(
    (o) => o.paymentStatus === "refunded",
  ).length;
  const completedCount = orders.filter(
    (o) =>
      (o.paymentStatus === "paid" || o.paymentStatus === "partial") &&
      o.status !== "cancelled",
  ).length;

  const getSupplierShare = (o: (typeof orders)[0]) =>
    o.subtotal > 0 ? (o.supplierSubtotal / o.subtotal) * o.total : 0;

  const ordersExcludingCancelled = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = ordersExcludingCancelled.reduce(
    (sum, o) => sum + getSupplierShare(o),
    0,
  );
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === "paid" && o.status !== "cancelled")
    .reduce((sum, o) => sum + getSupplierShare(o), 0);
  const unpaidRevenue = orders
    .filter(
      (o) =>
        o.paymentStatus !== "paid" &&
        o.paymentStatus !== "refunded" &&
        o.status !== "cancelled",
    )
    .reduce((sum, o) => sum + getSupplierShare(o), 0);

  const revenueBreakdown = {
    paid: orders
      .filter((o) => o.paymentStatus === "paid" && o.status !== "cancelled")
      .reduce((sum, o) => sum + getSupplierShare(o), 0),
    due: orders
      .filter(
        (o) =>
          (o.paymentStatus === "due" || o.paymentStatus === "unpaid") &&
          o.status !== "cancelled",
      )
      .reduce((sum, o) => sum + getSupplierShare(o), 0),
    refund: orders
      .filter((o) => o.paymentStatus === "refunded")
      .reduce((sum, o) => sum + getSupplierShare(o), 0),
    pending: orders
      .filter(
        (o) =>
          (o.paymentStatus === "unpaid" ||
            o.paymentStatus === "partial" ||
            o.paymentStatus === "pending") &&
          o.status !== "cancelled",
      )
      .reduce((sum, o) => sum + getSupplierShare(o), 0),
  };

  const cancelledOrderAmount = orders
    .filter((o) => o.status === "cancelled")
    .reduce((sum, o) => sum + getSupplierShare(o), 0);

  const valueBreakdown = {
    orders: totalRevenue,
    invoices: totalRevenue,
    due: revenueBreakdown.due,
    cancelled: cancelledOrderAmount,
    refunded: revenueBreakdown.refund,
  };

  // Invoices for orders that contain supplier's products (created by product owner)
  const orderIds = orders.map((o) => o.id);
  const refundedOrderIds = new Set(
    orders.filter((o) => o.paymentStatus === "refunded").map((o) => o.id),
  );
  const invoices = await prisma.invoice.findMany({
    where: { orderId: { in: orderIds } },
    select: { id: true, orderId: true, status: true },
  });
  const totalInvoices = invoices.length;
  const invoiceBreakdown = {
    paid: invoices.filter((i) => i.status === "paid").length,
    pending:
      invoices.filter(
        (i) => i.status === "draft" || i.status === "sent",
      ).length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
    refunded: invoices.filter((i) => refundedOrderIds.has(i.orderId)).length,
  };

  // Recent orders (last 10) — "total" = supplier's share of order total
  const recentOrders = orders
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((o) => {
      const revenueShare =
        o.subtotal > 0 ? (o.supplierSubtotal / o.subtotal) * o.total : 0;
      return withOrderStatusAt({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: revenueShare,
        createdAt: o.createdAt.toISOString(),
        productCount: o.productCount,
        paymentStatus: o.paymentStatus,
        cancelledAt: o.cancelledAt,
        deliveredAt: o.deliveredAt,
        shippedAt: o.shippedAt,
        updatedAt: o.updatedAt,
        invoice: o.invoice,
      });
    });

  const STOCK_LOW_MAX = 20;

  const productStatusCounts = { available: 0, stockLow: 0, stockOut: 0 };
  let productValue = 0;
  for (const p of products) {
    const qty = Number(p.quantity) ?? 0;
    const committed = productCommitted(
      p.id,
      Number(p.reservedQuantity ?? 0),
    );
    const available = qty - committed;
    productValue += qty * (Number(p.price) ?? 0);
    if (available > STOCK_LOW_MAX) productStatusCounts.available += 1;
    else if (available > 0) productStatusCounts.stockLow += 1;
    else productStatusCounts.stockOut += 1;
  }

  const lowStockProducts = products
    .filter((p) => {
      const available =
        Number(p.quantity) -
        productCommitted(p.id, Number(p.reservedQuantity ?? 0));
      return available > 0 && available <= STOCK_LOW_MAX;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantity:
        Number(p.quantity) -
        productCommitted(p.id, Number(p.reservedQuantity ?? 0)),
      status: p.status,
    }));

  // Monthly revenue (last 6 months) — use supplier's share of order total per order
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = new Map<
    string,
    { revenue: number; orders: Set<string> }
  >();

  for (const o of orders) {
    if (o.createdAt >= sixMonthsAgo) {
      const monthKey = o.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { revenue: 0, orders: new Set() });
      }
      const data = monthlyData.get(monthKey)!;
      const share =
        o.subtotal > 0 ? (o.supplierSubtotal / o.subtotal) * o.total : 0;
      data.revenue += share;
      data.orders.add(o.id);
    }
  }

  const monthlyRevenue = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders.size,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    totalProducts: products.length,
    productStatusCounts,
    productValue,
    valueBreakdown,
    totalOrders,
    pendingOrders,
    totalInvoices,
    invoiceBreakdown,
    orderStatusCounts: {
      pending: pendingCount,
      inProgress: inProgressCount,
      shipped: shippedCount,
      delivered: deliveredCount,
      completed: completedCount,
      cancelled: cancelledCount,
      refunded: refundedCount,
    },
    totalRevenue,
    paidRevenue,
    unpaidRevenue,
    revenueBreakdown,
    recentOrders,
    lowStockProducts,
    monthlyRevenue,
  };
}
