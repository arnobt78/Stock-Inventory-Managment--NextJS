/**
 * Server-side data fetching for invoices page SSR
 * Fetches invoices using the same logic and cache as GET /api/invoices (no filters).
 * Only import this from server code (e.g. app/invoices/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { getInvoicesByUser, getInvoicesByClientId, getInvoicesByOrderIds } from "@/prisma/invoice";
import {
  getOrdersContainingProductOwnerProducts,
  getOrdersContainingSupplierProducts,
} from "@/prisma/order";
import { fetchOrderUserIdMap } from "@/lib/invoices/enrich-order-user-ids";
import {
  attachInvoiceListOrderPreview,
  fetchInvoiceListOrderPreviewMap,
} from "@/lib/invoices/enrich-invoice-list-orders";
import {
  resolveBuyerDisplayFromUsers,
  resolveBuyerUserId,
} from "@/lib/orders/order-party";
import { prisma } from "@/prisma/client";
import type { InvoiceFilters } from "@/types/invoice";
import type { OrderItem } from "@/types";

/** Invoice shape returned by invoices API GET (dates as ISO strings) */
export type InvoiceForPage = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  clientId: string | null;
  status: string;
  subtotal: number;
  tax: number | null;
  shipping: number | null;
  discount: number | null;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  issuedAt: string;
  sentAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  paymentLink: string | null;
  notes: string | null;
  billingAddress: unknown;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  /** Client/customer display name (for admin list; from order shipping or placer) */
  customerDisplay?: string | null;
  /** Client name the invoice is billed to (for admin personal invoices) */
  clientName?: string | null;
  /** Client email the invoice is billed to (for admin personal invoices) */
  clientEmail?: string | null;
  /** Invoice creator/issuer name (for client list — who issued the invoice) */
  issuedByName?: string | null;
  /** Invoice creator/issuer email */
  issuedByEmail?: string | null;
  /** User who placed the linked order (for admin self/client source tagging) */
  orderUserId?: string | null;
  /** REQ-0150 / REQ-0151 — linked order preview for dense table */
  linkedOrderNumber?: string | null;
  linkedOrderCreatedAt?: string | null;
  linkedOrderItems?: OrderItem[];
  linkedOrderStatus?: string | null;
  linkedOrderPaymentStatus?: string | null;
  linkedOrderStatusAt?: string | null;
  linkedOrderPaidAt?: string | null;
  statusAt?: string;
};

async function transformInvoicesForList(
  invoices: Awaited<ReturnType<typeof getInvoicesByUser>>,
): Promise<InvoiceForPage[]> {
  const orderUserIdMap = await fetchOrderUserIdMap(
    invoices.map((inv) => inv.orderId),
  );

  const clientIds = [...new Set(invoices.map((inv) => inv.clientId).filter(Boolean))] as string[];
  const clients = clientIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const clientMap = new Map(clients.map((c) => [c.id, { name: c.name, email: c.email }]));

  const orderPreviewMap = await fetchInvoiceListOrderPreviewMap(
    invoices.map((inv) => inv.orderId),
  );

  return invoices.map((invoice) => {
    const clientInfo = invoice.clientId ? clientMap.get(invoice.clientId) : undefined;
    const base = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      userId: invoice.userId,
      clientId: invoice.clientId ?? null,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax ?? null,
      shipping: invoice.shipping ?? null,
      discount: invoice.discount ?? null,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate.toISOString(),
      issuedAt: invoice.issuedAt.toISOString(),
      sentAt: invoice.sentAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      cancelledAt: invoice.cancelledAt?.toISOString() || null,
      paymentLink: invoice.paymentLink,
      notes: invoice.notes,
      billingAddress: invoice.billingAddress,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString() || null,
      createdBy: invoice.createdBy,
      updatedBy: invoice.updatedBy,
      clientName: clientInfo?.name ?? clientInfo?.email ?? null,
      clientEmail: clientInfo?.email ?? null,
      orderUserId: orderUserIdMap.get(invoice.orderId) ?? null,
    };
    return attachInvoiceListOrderPreview(base, orderPreviewMap);
  });
}

/**
 * Fetch invoices for the given user (no filters — default list view).
 * Uses the same cache key as GET /api/invoices with empty filters so Redis is shared.
 */
export async function getInvoicesForUser(
  userId: string
): Promise<InvoiceForPage[]> {
  const filters = {};
  const cacheKey = cacheKeys.invoices.list({ userId, scope: "issuer" });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<InvoiceForPage[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const invoices = await getInvoicesByUser(userId, undefined);

  const transformed = await transformInvoicesForList(invoices);

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch invoices for orders that contain products from the given supplier.
 * Used for role=supplier on /invoices page SSR (REQ-0075 AC2).
 */
export async function getInvoicesForSupplierId(
  supplierId: string,
  filters?: InvoiceFilters,
): Promise<InvoiceForPage[]> {
  const cacheFilters = filters ?? {};
  const cacheKey = cacheKeys.invoices.list({
    supplierId,
    ...(Object.keys(cacheFilters).length > 0 ? cacheFilters : {}),
  });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<InvoiceForPage[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersContainingSupplierProducts(supplierId);
  const orderIds = orders.map((o) => o.id);
  const invoices =
    orderIds.length > 0
      ? await getInvoicesByOrderIds(orderIds, cacheFilters)
      : [];

  const transformed = await transformInvoicesForList(invoices);

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch invoices where the given user is the client (clientId = clientUserId).
 * Used for client role on /invoices page SSR.
 */
export async function getInvoicesForClientId(
  clientUserId: string,
): Promise<InvoiceForPage[]> {
  const cacheKey = cacheKeys.invoices.list({
    byClient: true,
    userId: clientUserId,
  });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<InvoiceForPage[]>(cacheKey);
  if (cached) return cached;

  const invoices = await getInvoicesByClientId(clientUserId, undefined);

  // Resolve issuer (product owner) from order items for each invoice
  const orderIds = [...new Set(invoices.map((inv) => inv.orderId))];
  const orders = orderIds.length > 0
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { items: { include: { product: { select: { userId: true } } } } },
      })
    : [];
  const orderProductOwnerMap = new Map<string, string>();
  for (const order of orders) {
    const ownerIds = [
      ...new Set(
        order.items
          .map((item) => (item as { product?: { userId?: string } }).product?.userId)
          .filter(Boolean),
      ),
    ] as string[];
    if (ownerIds.length > 0 && ownerIds[0]) orderProductOwnerMap.set(order.id, ownerIds[0]);
  }

  // Collect all user IDs we need to look up (product owners + invoice.userId for fallback)
  const allUserIds = [
    ...new Set([
      ...invoices.map((inv) => inv.userId),
      ...invoices.map((inv) => inv.createdBy),
      ...Array.from(orderProductOwnerMap.values()),
    ]),
  ].filter(Boolean);
  const users =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const orderPreviewMap = await fetchInvoiceListOrderPreviewMap(
    invoices.map((inv) => inv.orderId),
  );

  const transformed: InvoiceForPage[] = invoices.map((invoice) => {
    // Priority: product owner from order items > createdBy > userId
    const productOwnerId = orderProductOwnerMap.get(invoice.orderId);
    const issuerId = productOwnerId ?? invoice.createdBy ?? invoice.userId;
    const issuer = userMap.get(issuerId);
    const order = orders.find((o) => o.id === invoice.orderId);
    const base = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      userId: invoice.userId,
      clientId: invoice.clientId ?? null,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax ?? null,
      shipping: invoice.shipping ?? null,
      discount: invoice.discount ?? null,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate.toISOString(),
      issuedAt: invoice.issuedAt.toISOString(),
      sentAt: invoice.sentAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      cancelledAt: invoice.cancelledAt?.toISOString() || null,
      paymentLink: invoice.paymentLink,
      notes: invoice.notes,
      billingAddress: invoice.billingAddress,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString() || null,
      createdBy: invoice.createdBy,
      updatedBy: invoice.updatedBy,
      issuedByName: issuer?.name ?? issuer?.email ?? null,
      issuedByEmail: issuer?.email ?? null,
      orderUserId: order?.userId ?? null,
    };
    return attachInvoiceListOrderPreview(base, orderPreviewMap);
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch invoices for orders that contain products owned by the given user (product owner).
 * Used for admin "Client Invoices" list.
 */
export async function getClientInvoicesForProductOwner(
  productOwnerUserId: string,
  filters?: InvoiceFilters,
): Promise<InvoiceForPage[]> {
  const cacheFilters = filters ?? {};
  const cacheKey = cacheKeys.invoices.list({
    productOwnerId: productOwnerUserId,
    ...(Object.keys(cacheFilters).length > 0 ? cacheFilters : {}),
  });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<InvoiceForPage[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersContainingProductOwnerProducts(
    productOwnerUserId,
  );
  const orderIds = orders.map((o) => o.id);
  const invoices = await getInvoicesByOrderIds(orderIds, cacheFilters);

  // REQ-0159 — customerDisplay / clientName from buyer, not store owner
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const buyerIds = [
    ...new Set(
      [
        ...orders.map((o) => resolveBuyerUserId(o)),
        ...invoices
          .map((inv) => inv.clientId)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ].filter(Boolean),
    ),
  ];
  const users =
    buyerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: buyerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const orderCustomerDisplay = new Map<string, string>();
  const orderUserIdMap = new Map<string, string>();
  for (const order of orders) {
    const buyer = resolveBuyerDisplayFromUsers(
      { userId: order.userId, clientId: order.clientId },
      userMap,
    );
    const addr = order.shippingAddress as
      | { name?: string; email?: string }
      | null
      | undefined;
    // Prefer shipping name only when it matches buyer context; else buyer user
    const shipLabel = addr?.name ?? addr?.email ?? null;
    orderCustomerDisplay.set(
      order.id,
      buyer.name ?? shipLabel ?? "Client",
    );
    orderUserIdMap.set(order.id, order.userId);
  }

  const orderPreviewMap = await fetchInvoiceListOrderPreviewMap(
    invoices.map((inv) => inv.orderId),
  );

  const transformed: InvoiceForPage[] = invoices.map((invoice) => {
    const order = orderById.get(invoice.orderId);
    const buyer = resolveBuyerDisplayFromUsers(
      {
        userId: order?.userId ?? invoice.userId,
        clientId: invoice.clientId ?? order?.clientId,
      },
      userMap,
    );
    const base = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      userId: invoice.userId,
      clientId: invoice.clientId ?? null,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax ?? null,
      shipping: invoice.shipping ?? null,
      discount: invoice.discount ?? null,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate.toISOString(),
      issuedAt: invoice.issuedAt.toISOString(),
      sentAt: invoice.sentAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      cancelledAt: invoice.cancelledAt?.toISOString() || null,
      paymentLink: invoice.paymentLink,
      notes: invoice.notes,
      billingAddress: invoice.billingAddress,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString() || null,
      createdBy: invoice.createdBy,
      updatedBy: invoice.updatedBy,
      customerDisplay: orderCustomerDisplay.get(invoice.orderId) ?? buyer.name,
      clientName: buyer.name,
      clientEmail: buyer.email,
      orderUserId: orderUserIdMap.get(invoice.orderId) ?? null,
    };
    return attachInvoiceListOrderPreview(base, orderPreviewMap);
  });

  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}
