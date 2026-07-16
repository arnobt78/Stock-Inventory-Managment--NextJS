/**
 * Server-side data fetching for orders page SSR
 * Fetches orders using the same logic and cache as GET /api/orders.
 * Only import this from server code (e.g. app/orders/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import {
  getOrdersByUser,
  getOrdersByClientId,
  getOrdersContainingSupplierProducts,
  getOrdersContainingProductOwnerProducts,
} from "@/prisma/order";
import { getInvoicesByOrderIds } from "@/prisma/invoice";
import { prisma } from "@/prisma/client";
import { resolveOrderStatusAtFromSource } from "@/lib/orders/order-status-display-date";

/**
 * Linked invoice ref per order row (REQ-0061 actions; REQ-0145 list Invoice # column).
 * List map always fills createdAt/dueDate/amountDue/status; detail may omit extras.
 */
export type InvoiceLinkFields = {
  id: string;
  invoiceNumber: string;
  paidAt: string | null;
  createdAt?: string;
  dueDate?: string;
  amountDue?: number;
  status?: string;
  /** REQ-0145 — terminal event dates for Invoice # / Payment cells */
  sentAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string | null;
};

export type InvoiceLinkForOrder = InvoiceLinkFields | null;

/**
 * Batch-resolve orderId → linked invoice for list/detail enrich.
 * One query for the whole page (uses existing getInvoicesByOrderIds helper).
 */
export async function getInvoiceLinkMap(
  orderIds: string[],
): Promise<Map<string, InvoiceLinkFields>> {
  if (orderIds.length === 0) return new Map();
  const invoices = await getInvoicesByOrderIds(orderIds);
  return new Map(
    invoices.map((inv) => [
      inv.orderId,
      {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        amountDue: inv.amountDue,
        status: inv.status,
        sentAt: inv.sentAt?.toISOString() ?? null,
        cancelledAt: inv.cancelledAt?.toISOString() ?? null,
        updatedAt: inv.updatedAt?.toISOString() ?? null,
      },
    ]),
  );
}

function orderStatusAtForListRow(
  order: {
    status: string;
    paymentStatus: string;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
    updatedAt?: string | null;
  },
  invoiceLink: InvoiceLinkForOrder,
): string | undefined {
  return resolveOrderStatusAtFromSource(
    {
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      updatedAt: order.updatedAt,
    },
    invoiceLink,
  );
}

function finalizeOrderForPage(
  row: Omit<OrderForPage, "statusAt" | "invoiceForOrder">,
  invoiceForOrder: InvoiceLinkForOrder,
): OrderForPage {
  const statusAt = orderStatusAtForListRow(row, invoiceForOrder);
  return {
    ...row,
    invoiceForOrder,
    ...(statusAt ? { statusAt } : {}),
  };
}

export function buildOrderForPageRow(
  row: Omit<OrderForPage, "statusAt" | "invoiceForOrder">,
  invoiceForOrder: InvoiceLinkForOrder,
): OrderForPage {
  return finalizeOrderForPage(row, invoiceForOrder);
}

/** Order item shape (dates as ISO strings) */
type OrderItemForPage = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: string;
};

/** Order shape returned by orders API GET (dates as ISO strings) */
export type OrderForPage = {
  id: string;
  orderNumber: string;
  userId: string;
  clientId: string | null;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number | null;
  shipping: number | null;
  discount: number | null;
  total: number;
  shippingAddress: unknown;
  billingAddress: unknown;
  notes: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  items: OrderItemForPage[];
  /** Placer name/email when shipping has none (e.g. Google one-click checkout) */
  placedByName?: string | null;
  /** Placer email from User */
  placedByEmail?: string | null;
  /** Product owner name (for client view) */
  productOwnerName?: string | null;
  /** Product owner email (for client view) */
  productOwnerEmail?: string | null;
  /** Linked invoice when this order has one (REQ-0061 — situation-based invoice actions) */
  invoiceForOrder?: InvoiceLinkForOrder;
  /** Terminal status timestamp for paid/shipped/delivered/cancelled rows (REQ-0129) */
  statusAt?: string;
};

/**
 * Fetch orders for the given user.
 * Uses the same cache key and transform as GET /api/orders so Redis is shared.
 */
export async function getOrdersForUser(
  userId: string
): Promise<OrderForPage[]> {
  const cacheKey = cacheKeys.orders.list({ userId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<OrderForPage[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const orders = await getOrdersByUser(userId);
  const firstOrder = orders[0];
  const [user, invoiceLinkMap] = await Promise.all([
    firstOrder != null
      ? prisma.user.findUnique({
          where: { id: firstOrder.userId },
          select: { name: true, email: true },
        })
      : Promise.resolve(null),
    getInvoiceLinkMap(orders.map((o) => o.id)),
  ]);
  const placedByName = user?.name ?? user?.email ?? null;

  const transformed: OrderForPage[] = orders.map((order) => {
    const invoiceForOrder = invoiceLinkMap.get(order.id) ?? null;
    return finalizeOrderForPage(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        clientId: order.clientId ?? null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        tax: order.tax ?? null,
        shipping: order.shipping ?? null,
        discount: order.discount ?? null,
        total: order.total,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        cancelledAt: order.cancelledAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt?.toISOString() || null,
        createdBy: order.createdBy,
        updatedBy: order.updatedBy,
        items: order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku ?? null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          createdAt: item.createdAt.toISOString(),
        })),
        placedByName,
      },
      invoiceForOrder,
    );
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch orders that contain at least one product from the given supplier.
 * Used for role=supplier: "View Orders" shows orders from any client/admin that include this supplier's products.
 */
export async function getOrdersForSupplierId(
  supplierId: string,
): Promise<OrderForPage[]> {
  const cacheKey = cacheKeys.orders.list({ supplierId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<OrderForPage[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const orders = await getOrdersContainingSupplierProducts(supplierId);

  const userIds = [...new Set(orders.map((o) => o.userId))];
  const [users, invoiceLinkMap] = await Promise.all([
    userIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    getInvoiceLinkMap(orders.map((o) => o.id)),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const transformed: OrderForPage[] = orders.map((order) => {
    const u = userMap.get(order.userId);
    return finalizeOrderForPage(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        clientId: order.clientId ?? null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        tax: order.tax ?? null,
        shipping: order.shipping ?? null,
        discount: order.discount ?? null,
        total: order.total,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        cancelledAt: order.cancelledAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt?.toISOString() ?? null,
        createdBy: order.createdBy,
        updatedBy: order.updatedBy,
        items: order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku ?? null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          createdAt: item.createdAt.toISOString(),
        })),
        placedByName: u?.name ?? u?.email ?? null,
        placedByEmail: u?.email ?? null,
      },
      invoiceLinkMap.get(order.id) ?? null,
    );
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch orders that contain at least one product owned by the given user (product owner).
 * Used for admin "Client Orders" list.
 */
export async function getClientOrdersForProductOwner(
  productOwnerUserId: string,
): Promise<OrderForPage[]> {
  const cacheKey = cacheKeys.orders.list({ productOwnerId: productOwnerUserId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<OrderForPage[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const orders = await getOrdersContainingProductOwnerProducts(productOwnerUserId);
  const userIds = [...new Set(orders.map((o) => o.userId))];
  const [users, invoiceLinkMap] = await Promise.all([
    userIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    getInvoiceLinkMap(orders.map((o) => o.id)),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const transformed: OrderForPage[] = orders.map((order) => {
    const u = userMap.get(order.userId);
    const placedByName = u?.name ?? u?.email ?? null;
    return finalizeOrderForPage(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        clientId: order.clientId ?? null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        tax: order.tax ?? null,
        shipping: order.shipping ?? null,
        discount: order.discount ?? null,
        total: order.total,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        cancelledAt: order.cancelledAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt?.toISOString() ?? null,
        createdBy: order.createdBy,
        updatedBy: order.updatedBy,
        items: order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku ?? null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          createdAt: item.createdAt.toISOString(),
        })),
        placedByName,
      },
      invoiceLinkMap.get(order.id) ?? null,
    );
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch orders for the given client (role=client: orders where they are the customer).
 * Uses a distinct cache key so client list does not mix with creator list.
 */
export async function getOrdersForClientId(
  clientId: string,
): Promise<OrderForPage[]> {
  const cacheKey = cacheKeys.orders.list({ userId: clientId, byClient: true });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<OrderForPage[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const orders = await getOrdersByClientId(clientId);

  // Resolve product owners for each order
  const allProductIds = [
    ...new Set(orders.flatMap((o) => o.items.map((item) => item.productId))),
  ];
  const products = allProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: allProductIds } },
        select: { id: true, userId: true },
      })
    : [];
  const productOwnerIdMap = new Map(products.map((p) => [p.id, p.userId]));
  const ownerIds = [...new Set(products.map((p) => p.userId))];
  const [ownerUsers, invoiceLinkMap] = await Promise.all([
    ownerIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    getInvoiceLinkMap(orders.map((o) => o.id)),
  ]);
  const ownerUserMap = new Map(ownerUsers.map((u) => [u.id, u]));

  const transformed: OrderForPage[] = orders.map((order) => {
    const firstProductId = order.items[0]?.productId;
    const ownerId = firstProductId ? productOwnerIdMap.get(firstProductId) : undefined;
    const owner = ownerId ? ownerUserMap.get(ownerId) : undefined;
    return finalizeOrderForPage(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        clientId: order.clientId ?? null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        tax: order.tax ?? null,
        shipping: order.shipping ?? null,
        discount: order.discount ?? null,
        total: order.total,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        cancelledAt: order.cancelledAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt?.toISOString() || null,
        createdBy: order.createdBy,
        updatedBy: order.updatedBy,
        items: order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku ?? null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          createdAt: item.createdAt.toISOString(),
        })),
        productOwnerName: owner?.name ?? owner?.email ?? null,
        productOwnerEmail: owner?.email ?? null,
      },
      invoiceLinkMap.get(order.id) ?? null,
    );
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}
