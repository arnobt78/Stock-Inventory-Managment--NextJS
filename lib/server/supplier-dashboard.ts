/**
 * Supplier Portal Server-Side Data Fetching
 * REQ-0224 — densify recentOrders + lowStockProducts with product/category/buyer meta
 */

import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import {
  batchSumAllocationReserved,
  computeCommittedQuantity,
} from "@/lib/products/enrich-product-committed-quantity";
import { buildPaymentMoneyStats } from "@/lib/insights/payment-money-stats";
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

  // Fetch supplier user image + products in parallel (REQ-0224)
  const [supplierUser, products] = await Promise.all([
    prisma.user.findUnique({
      where: { id: supplier.userId },
      select: { image: true },
    }),
    prisma.product.findMany({
      where: mergeProductListWhere({ supplierId: supplier.id }),
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        reservedQuantity: true,
        status: true,
        price: true,
        imageUrl: true,
        categoryId: true,
        supplierId: true,
      },
    }),
  ]);

  const supplierImageUrl = supplierUser?.image ?? null;

  const productIds = products.map((p) => p.id);
  const allocationReservedByProduct =
    await batchSumAllocationReserved(productIds);

  const productCommitted = (productId: string, productReserved: number) =>
    computeCommittedQuantity(
      productReserved,
      allocationReservedByProduct.get(productId) ?? 0,
    );

  // Get orders containing products from this supplier — include product relation + buyer ids
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
          userId: true,
          clientId: true,
          items: { select: { id: true } },
          ...orderStatusAtSelect,
        },
      },
      product: {
        select: {
          imageUrl: true,
          categoryId: true,
          supplierId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build unique orders map with supplier's portion of order total + first item densify
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
      userId: string;
      clientId: string | null;
      firstItemMeta?: {
        productId: string;
        productName: string;
        imageUrl: string | null;
        categoryId: string | null;
        itemCount: number;
      };
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
        userId: order.userId,
        clientId: order.clientId,
        firstItemMeta: {
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.product?.imageUrl ?? null,
          categoryId: item.product?.categoryId ?? null,
          itemCount: 1,
        },
      });
    } else {
      const existing = ordersMap.get(order.id)!;
      existing.supplierSubtotal += item.subtotal;
      if (existing.firstItemMeta) {
        existing.firstItemMeta.itemCount += 1;
      }
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

  const ordersExcludingCancelled = orders.filter(
    (o) => o.status !== "cancelled",
  );
  const totalRevenue = ordersExcludingCancelled.reduce(
    (sum, o) => sum + getSupplierShare(o),
    0,
  );
  // Invoices for orders that contain supplier's products (created by product owner)
  const orderIds = orders.map((o) => o.id);
  const refundedOrderIds = new Set(
    orders.filter((o) => o.paymentStatus === "refunded").map((o) => o.id),
  );
  const invoices = await prisma.invoice.findMany({
    where: { orderId: { in: orderIds } },
    select: {
      id: true,
      orderId: true,
      status: true,
      amountPaid: true,
      amountDue: true,
      total: true,
    },
  });

  // REQ-0154 — scale invoice money by supplier share of each order, then partition
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const scaledInvoices = invoices.map((inv) => {
    const o = orderById.get(inv.orderId);
    const factor = o && o.total > 0 ? getSupplierShare(o) / o.total : 0;
    return {
      status: inv.status,
      amountPaid: (inv.amountPaid ?? 0) * factor,
      amountDue: (inv.amountDue ?? 0) * factor,
      total: (inv.total ?? 0) * factor,
    };
  });
  const moneyStats = buildPaymentMoneyStats(scaledInvoices);

  const revenueBreakdown = {
    paid: moneyStats.paidCollected,
    partial: moneyStats.partialCollected,
    due: moneyStats.dueOutstanding,
    refund: orders
      .filter((o) => o.paymentStatus === "refunded")
      .reduce((sum, o) => sum + getSupplierShare(o), 0),
    pending: moneyStats.pendingUnpaidDue,
  };

  const paidRevenue = moneyStats.paidCollected;
  const unpaidRevenue =
    moneyStats.partialCollected +
    moneyStats.dueOutstanding +
    moneyStats.pendingUnpaidDue;

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

  const totalInvoices = invoices.length;
  const invoiceBreakdown = {
    paid: moneyStats.paidInvoiceCount,
    partial: moneyStats.partialInvoiceCount,
    pending: moneyStats.pendingInvoiceCount,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
    refunded: invoices.filter((i) => refundedOrderIds.has(i.orderId)).length,
  };

  const STOCK_LOW_MAX = 20;

  const productStatusCounts = { available: 0, stockLow: 0, stockOut: 0 };
  let productValue = 0;
  for (const p of products) {
    const qty = Number(p.quantity) ?? 0;
    const committed = productCommitted(p.id, Number(p.reservedQuantity ?? 0));
    const available = qty - committed;
    productValue += qty * (Number(p.price) ?? 0);
    if (available > STOCK_LOW_MAX) productStatusCounts.available += 1;
    else if (available > 0) productStatusCounts.stockLow += 1;
    else productStatusCounts.stockOut += 1;
  }

  const lowStockRaw = products.filter((p) => {
    const available =
      Number(p.quantity) -
      productCommitted(p.id, Number(p.reservedQuantity ?? 0));
    return available > 0 && available <= STOCK_LOW_MAX;
  });

  // REQ-0224 — batch-fetch categories + buyer users for recent orders + low stock products
  const recentOrderSlice = orders
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const neededCategoryIds = new Set<string>();
  for (const o of recentOrderSlice) {
    if (o.firstItemMeta?.categoryId) neededCategoryIds.add(o.firstItemMeta.categoryId);
  }
  for (const p of lowStockRaw) {
    if (p.categoryId) neededCategoryIds.add(p.categoryId);
  }

  const buyerIds = [
    ...new Set(
      recentOrderSlice
        .map((o) => o.clientId ?? o.userId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [categoryRows, buyerUsers] = await Promise.all([
    neededCategoryIds.size > 0
      ? prisma.category.findMany({
          where: { id: { in: [...neededCategoryIds] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    buyerIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: buyerIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : Promise.resolve([] as { id: string; name: string | null; email: string; image: string | null }[]),
  ]);

  const categoryMap = new Map(categoryRows.map((c) => [c.id, c.name]));
  const buyerUserMap = new Map(buyerUsers.map((u) => [u.id, u]));

  // Recent orders (last 10) — "total" = supplier's share of order total + densify
  const recentOrders = recentOrderSlice.map((o) => {
    const revenueShare =
      o.subtotal > 0 ? (o.supplierSubtotal / o.subtotal) * o.total : 0;
    const first = o.firstItemMeta;
    const extraItemCount = first ? Math.max(0, first.itemCount - 1) : 0;
    const productPreview = first?.productName
      ? extraItemCount > 0
        ? `${first.productName} +${extraItemCount}`
        : first.productName
      : null;
    const categoryId = first?.categoryId ?? null;
    const buyerId = o.clientId ?? o.userId;
    const buyer = buyerUserMap.get(buyerId);
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
      productId: first?.productId ?? null,
      productPreview,
      productImageUrl: first?.imageUrl ?? null,
      categoryId,
      categoryName: categoryId ? (categoryMap.get(categoryId) ?? null) : null,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierImage: supplierImageUrl,
      placedById: buyerId,
      placedByName: buyer?.name ?? null,
      placedByEmail: buyer?.email ?? null,
      placedByImage: buyer?.image ?? null,
    });
  });

  const lowStockProducts = lowStockRaw.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    quantity:
      Number(p.quantity) -
      productCommitted(p.id, Number(p.reservedQuantity ?? 0)),
    status: p.status,
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: p.categoryId ? (categoryMap.get(p.categoryId) ?? null) : null,
    supplierId: p.supplierId ?? null,
    supplierName: supplier.name,
    supplierImage: supplierImageUrl,
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
