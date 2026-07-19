/**
 * Invoice Prisma Utilities
 * Helper functions for invoice database operations
 */

import { prisma } from "@/prisma/client";
import type { Prisma } from "@prisma/client";
import type { CreateInvoiceInput, UpdateInvoiceInput, InvoiceFilters } from "@/types/invoice";
import { logger } from "@/lib/logger";
import { applyIncrementalInvoicePayment } from "@/lib/payments/order-payment-from-amounts";

/** Shared Prisma where clauses for invoice list filters (issuer, client, store-by-orderIds). */
function applyInvoiceFiltersToWhere(
  base: Prisma.InvoiceWhereInput,
  filters?: InvoiceFilters,
): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = { ...base };

  if (filters?.searchTerm) {
    where.OR = [
      { invoiceNumber: { contains: filters.searchTerm, mode: "insensitive" } },
      { notes: { contains: filters.searchTerm, mode: "insensitive" } },
    ];
  }

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters?.orderId) {
    where.orderId = filters.orderId;
  }

  if (filters?.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  if (filters?.dueDateStart || filters?.dueDateEnd) {
    where.dueDate = {};
    if (filters.dueDateStart) {
      where.dueDate.gte = new Date(filters.dueDateStart);
    }
    if (filters.dueDateEnd) {
      where.dueDate.lte = new Date(filters.dueDateEnd);
    }
  }

  return where;
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-HHMMSS-XXXX (e.g., INV-20240116-143022-1234)
 *
 * @returns Promise<string> - Unique invoice number
 */
export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

  let invoiceNumber = `INV-${datePart}-${timePart}-${randomPart}`;

  // Ensure uniqueness (unlikely to collide, but good practice)
  let exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  while (exists) {
    const newRandomPart = Math.floor(1000 + Math.random() * 9000);
    invoiceNumber = `INV-${datePart}-${timePart}-${newRandomPart}`;
    exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  }

  return invoiceNumber;
}

/**
 * Create a new invoice from an order
 * Calculates totals and amounts based on order data
 *
 * @param data - Invoice creation input data
 * @param userId - ID of the user creating the invoice
 * @returns Promise<Invoice> - The created invoice
 * @throws Error if order not found or invoice already exists for order
 */
export async function createInvoice(
  data: CreateInvoiceInput,
  userId: string
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>> {
  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Order with ID ${data.orderId} not found`);
  }

  // Check if invoice already exists for this order
  const existingInvoice = await prisma.invoice.findUnique({
    where: { orderId: data.orderId },
  });

  if (existingInvoice) {
    throw new Error(`Invoice already exists for order ${data.orderId}`);
  }

  // Generate unique invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Calculate invoice amounts based on order (include shipping for order ↔ invoice transparency)
  const subtotal = order.subtotal;
  const tax = data.tax ?? order.tax ?? 0;
  const shipping = data.shipping ?? order.shipping ?? 0;
  const discount = data.discount ?? order.discount ?? 0;
  const total = Math.max(0, subtotal + tax + shipping - discount);

  // Parse due date
  const dueDate = new Date(data.dueDate);
  const issuedAt = new Date();

  // Calculate amount due (starts at total, will be updated as payments are made)
  const amountPaid = 0;
  const amountDue = total;

  // Get billing address from order if available
  const billingAddress = order.billingAddress
    ? (JSON.parse(JSON.stringify(order.billingAddress)) as Prisma.InputJsonValue)
    : null;

  // REQ-0158: invoice.userId = store owner (order.userId); clientId = buyer; createdBy = actor
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: data.orderId,
      userId: order.userId,
      clientId: order.clientId,
      status: "draft",
      subtotal,
      tax: tax > 0 ? tax : null,
      shipping: shipping > 0 ? shipping : null,
      discount: discount > 0 ? discount : null,
      total,
      amountPaid,
      amountDue,
      dueDate,
      issuedAt,
      sentAt: null,
      paidAt: null,
      cancelledAt: null,
      paymentLink: data.paymentLink || null,
      notes: data.notes || null,
      billingAddress,
      createdBy: userId,
      updatedBy: null,
      createdAt: issuedAt,
      updatedAt: null,
    },
  });

  logger.info("Invoice created successfully", {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: data.orderId,
    userId: order.userId,
    createdBy: userId,
  });

  return invoice;
}

/**
 * REQ-0152 — Apply a Stripe charge to the order's invoice (create if missing).
 * Incremental: prior amountPaid + chargeAmount; full settle → paid, else sent + due left.
 *
 * @param orderId - Order that received a Stripe payment
 * @param chargeAmount - Amount charged this session (dollars)
 */
export async function applyStripeChargeToOrderInvoice(
  orderId: string,
  chargeAmount: number,
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { userId: true } } },
      },
    },
  });

  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  const productOwnerIds = [
    ...new Set(
      order.items
        .map((item) => (item as { product?: { userId?: string } }).product?.userId)
        .filter(Boolean),
    ),
  ] as string[];
  const issuerId = productOwnerIds[0] ?? order.userId;

  const existingInvoice = await prisma.invoice.findUnique({
    where: { orderId },
  });

  const now = new Date();
  const total = order.total;
  const charge = chargeAmount > 0 ? chargeAmount : total;

  if (existingInvoice) {
    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: existingInvoice.amountPaid,
      total: existingInvoice.total,
      chargeAmount: charge,
      priorStatus: existingInvoice.status,
    });
    const updated = await prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: {
        status: next.status,
        amountPaid: next.amountPaid,
        amountDue: next.amountDue,
        paidAt: next.fullyPaid ? now : null,
        updatedAt: now,
        updatedBy: issuerId,
      },
    });
    logger.info("Invoice updated from Stripe order charge", {
      invoiceId: updated.id,
      orderId,
      amountPaid: next.amountPaid,
      amountDue: next.amountDue,
    });
    return updated;
  }

  const next = applyIncrementalInvoicePayment({
    priorAmountPaid: 0,
    total,
    chargeAmount: charge,
    priorStatus: "sent",
  });

  const invoiceNumber = await generateInvoiceNumber();
  const subtotal = order.subtotal;
  const tax = order.tax ?? 0;
  const shipping = order.shipping ?? 0;
  const discount = order.discount ?? 0;
  const billingAddress = order.billingAddress
    ? (JSON.parse(JSON.stringify(order.billingAddress)) as Prisma.InputJsonValue)
    : null;

  // REQ-0158 — invoice.userId = store owner on order; createdBy = product owner issuer
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      userId: order.userId,
      clientId: order.clientId,
      status: next.status,
      subtotal,
      tax: tax > 0 ? tax : null,
      shipping: shipping > 0 ? shipping : null,
      discount: discount > 0 ? discount : null,
      total,
      amountPaid: next.amountPaid,
      amountDue: next.amountDue,
      dueDate: now,
      issuedAt: now,
      sentAt: now,
      paidAt: next.fullyPaid ? now : null,
      cancelledAt: null,
      paymentLink: null,
      notes: next.fullyPaid
        ? "Auto-generated when order was paid via Stripe."
        : "Auto-generated from Stripe partial payment on order.",
      billingAddress,
      createdBy: issuerId,
      updatedBy: null,
      createdAt: now,
      updatedAt: null,
    },
  });

  logger.info("Invoice auto-created for Stripe order charge", {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId,
    amountPaid: next.amountPaid,
  });

  return invoice;
}

/**
 * @deprecated Prefer applyStripeChargeToOrderInvoice (REQ-0152 incremental).
 * Kept as alias for existing webhook/import call sites.
 */
export async function ensureInvoiceForPaidOrder(
  orderId: string,
  amountPaid: number,
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>> {
  return applyStripeChargeToOrderInvoice(orderId, amountPaid);
}

/**
 * Get all invoices for a user
 *
 * @param userId - ID of the user
 * @param filters - Optional filters for invoices
 * @returns Promise<Invoice[]> - Array of invoices
 */
/**
 * Self invoices for a store owner (issuer + self buyer).
 * REQ-0158: userId = owner AND (clientId null OR clientId = owner).
 */
export async function getInvoicesByUser(
  userId: string,
  filters?: InvoiceFilters
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>[]> {
  const where = applyInvoiceFiltersToWhere(
    {
      userId,
      AND: [{ OR: [{ clientId: null }, { clientId: userId }] }],
    },
    filters,
  );

  return prisma.invoice.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get invoices where the given user is the client (clientId = clientUserId).
 * Used for client role on /invoices page.
 */
export async function getInvoicesByClientId(
  clientUserId: string,
  filters?: InvoiceFilters
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>[]> {
  const where = applyInvoiceFiltersToWhere({ clientId: clientUserId }, filters);

  return prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get invoices by order IDs (for product owner: invoices for store / client orders).
 */
export async function getInvoicesByOrderIds(
  orderIds: string[],
  filters?: InvoiceFilters,
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>[]> {
  if (orderIds.length === 0) return [];

  const where = applyInvoiceFiltersToWhere(
    { orderId: { in: orderIds } },
    filters,
  );

  return prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single invoice by ID
 *
 * @param invoiceId - ID of the invoice
 * @param userId - ID of the user (for authorization)
 * @returns Promise<Invoice | null> - The invoice or null if not found/unauthorized
 */
export async function getInvoiceById(
  invoiceId: string,
  userId: string
): Promise<Prisma.InvoiceGetPayload<Record<string, never>> | null> {
  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId, // Ensure invoice belongs to user
    },
  });
}

/**
 * Get invoice by ID for product owner (invoice's order must contain at least one product owned by this user).
 */
export async function getInvoiceByIdForProductOwner(
  invoiceId: string,
  productOwnerUserId: string,
): Promise<Prisma.InvoiceGetPayload<Record<string, never>> | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) return null;
  const { getOrderByIdForProductOwner } = await import("@/prisma/order");
  const order = await getOrderByIdForProductOwner(
    invoice.orderId,
    productOwnerUserId,
  );
  return order ? invoice : null;
}

/**
 * Get invoice by order ID
 *
 * @param orderId - ID of the order
 * @param userId - ID of the user (for authorization)
 * @returns Promise<Invoice | null> - The invoice or null if not found/unauthorized
 */
export async function getInvoiceByOrderId(
  orderId: string,
  userId: string
): Promise<Prisma.InvoiceGetPayload<Record<string, never>> | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
  });

  // Verify invoice belongs to user
  if (invoice && invoice.userId !== userId) {
    return null;
  }

  return invoice;
}

/**
 * Update an existing invoice
 *
 * @param invoiceId - ID of the invoice to update
 * @param data - Update data
 * @param userId - ID of the user performing the update (for authorization and audit)
 * @returns Promise<Invoice> - The updated invoice
 * @throws Error if invoice not found or unauthorized
 */
export async function updateInvoice(
  invoiceId: string,
  data: UpdateInvoiceInput,
  userId: string
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>> {
  // Check if invoice exists and belongs to user
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
    },
  });

  if (!existingInvoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  // Prepare update data
  const updateData: Prisma.InvoiceUpdateInput = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  // Update fields if provided
  if (data.status) updateData.status = data.status;
  if (data.tax !== undefined) updateData.tax = data.tax > 0 ? data.tax : null;
  if (data.shipping !== undefined)
    updateData.shipping = data.shipping > 0 ? data.shipping : null;
  if (data.discount !== undefined)
    updateData.discount = data.discount > 0 ? data.discount : null;

  // Derive total = subtotal + tax + shipping - discount when tax, shipping, or discount change (run before amountPaid so "paid" check uses correct total)
  if (data.tax !== undefined || data.shipping !== undefined || data.discount !== undefined) {
    const subtotalVal = existingInvoice.subtotal ?? 0;
    const taxVal = (data.tax ?? existingInvoice.tax) ?? 0;
    const shippingVal = (data.shipping ?? existingInvoice.shipping) ?? 0;
    const discountVal = (data.discount ?? existingInvoice.discount) ?? 0;
    const derivedTotal = Math.max(0, subtotalVal + taxVal + shippingVal - discountVal);
    updateData.total = derivedTotal;
    const amountPaidVal = data.amountPaid ?? existingInvoice.amountPaid;
    updateData.amountDue = Math.max(0, derivedTotal - amountPaidVal);
  } else if (data.total !== undefined) {
    updateData.total = data.total;
    const amountPaidVal = data.amountPaid ?? existingInvoice.amountPaid;
    updateData.amountDue = Math.max(0, data.total - amountPaidVal);
  }

  if (data.amountPaid !== undefined) {
    updateData.amountPaid = data.amountPaid;
    // Recalculate amount due: total - amountPaid (use derived total when set, else data.total or existing)
    const total =
      (updateData.total as number) ??
      data.total ??
      existingInvoice.total;
    const amountDue = total - data.amountPaid;
    updateData.amountDue = Math.max(0, amountDue);

    // REQ-0152 — auto paid when fully settled; downgrade paid → sent if amount lowered
    if (data.amountPaid >= total && existingInvoice.status !== "paid") {
      updateData.status = "paid";
      updateData.paidAt = new Date();
    } else if (
      data.amountPaid < total &&
      existingInvoice.status === "paid"
    ) {
      updateData.status = "sent";
      updateData.paidAt = null;
    }
  }

  // Only apply client-sent amountDue when neither amountPaid nor total nor tax/shipping/discount were updated
  if (
    data.amountDue !== undefined &&
    data.amountPaid === undefined &&
    data.total === undefined &&
    data.tax === undefined &&
    data.shipping === undefined &&
    data.discount === undefined
  ) {
    updateData.amountDue = data.amountDue;
  }
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
  if (data.sentAt) updateData.sentAt = new Date(data.sentAt);
  if (data.paidAt) updateData.paidAt = new Date(data.paidAt);
  if (data.cancelledAt && data.cancelledAt !== "")
    updateData.cancelledAt = new Date(data.cancelledAt);
  if (data.paymentLink !== undefined) updateData.paymentLink = data.paymentLink;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Update status-specific timestamps
  if (data.status === "sent" && !existingInvoice.sentAt) {
    updateData.sentAt = new Date();
  }
  if (data.status === "paid" && !existingInvoice.paidAt) {
    updateData.paidAt = new Date();
  }
  if (data.status === "cancelled" && !existingInvoice.cancelledAt) {
    updateData.cancelledAt = new Date();
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  });
}

/**
 * Delete an invoice
 *
 * @param invoiceId - ID of the invoice to delete
 * @param userId - ID of the user performing the deletion (for authorization)
 * @returns Promise<void>
 * @throws Error if invoice not found or unauthorized
 */
export async function deleteInvoice(
  invoiceId: string,
  userId: string
): Promise<void> {
  // Check if invoice exists and belongs to user
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
    },
  });

  if (!existingInvoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  await prisma.invoice.delete({
    where: { id: invoiceId },
  });
}

/**
 * Mark invoice as sent
 * Updates status to "sent" and sets sentAt timestamp
 *
 * @param invoiceId - ID of the invoice
 * @param userId - ID of the user performing the action (for authorization)
 * @returns Promise<Invoice> - The updated invoice
 */
export async function markInvoiceAsSent(
  invoiceId: string,
  userId: string
): Promise<Prisma.InvoiceGetPayload<Record<string, never>>> {
  return updateInvoice(
    invoiceId,
    {
      id: invoiceId,
      status: "sent",
    },
    userId
  );
}
