/**
 * REQ-0127 — pick the most relevant timestamp for recent-order status display.
 */

export type OrderStatusDateInput = {
  status?: string | null;
  paymentStatus?: string | null;
  paidAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  shippedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type OrderStatusAtSource = OrderStatusDateInput & {
  invoice?: { paidAt?: Date | string | null } | null;
};

export type InvoicePaidAtLink = { paidAt?: string | null } | null | undefined;

function resolvePaidAt(
  source: OrderStatusAtSource,
  invoiceLink?: InvoicePaidAtLink,
): Date | string | null | undefined {
  return source.paidAt ?? invoiceLink?.paidAt ?? source.invoice?.paidAt ?? null;
}

/** Resolve statusAt from order fields + optional invoice link or nested invoice.paidAt. */
export function resolveOrderStatusAtFromSource(
  source: OrderStatusAtSource,
  invoiceLink?: InvoicePaidAtLink,
): string | undefined {
  return resolveOrderStatusAt({
    status: source.status,
    paymentStatus: source.paymentStatus,
    cancelledAt: source.cancelledAt,
    deliveredAt: source.deliveredAt,
    shippedAt: source.shippedAt,
    updatedAt: source.updatedAt,
    paidAt: resolvePaidAt(source, invoiceLink),
  });
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Returns ISO string when status warrants a status-specific date on detail cards. */
export function resolveOrderStatusAt(
  order: OrderStatusDateInput,
): string | undefined {
  const status = order.status?.toLowerCase();
  const paymentStatus = order.paymentStatus?.toLowerCase();

  if (paymentStatus === "refunded") {
    return toIso(order.updatedAt) ?? toIso(order.paidAt);
  }
  if (status === "cancelled") {
    return toIso(order.cancelledAt) ?? toIso(order.updatedAt);
  }
  if (status === "delivered") {
    return toIso(order.deliveredAt) ?? toIso(order.shippedAt);
  }
  if (status === "shipped") {
    return toIso(order.shippedAt);
  }
  if (status === "paid" || paymentStatus === "paid" || paymentStatus === "partial") {
    return toIso(order.paidAt) ?? toIso(order.updatedAt);
  }

  return undefined;
}

/** Attach computed statusAt ISO string for recent-order list rows. Strips nested invoice. */
export function withOrderStatusAt<T extends OrderStatusAtSource>(
  row: T,
): Omit<T, "invoice"> & { statusAt?: string } {
  const { invoice: _invoice, ...rest } = row;
  const statusAt = resolveOrderStatusAtFromSource(row);
  if (!statusAt) return rest as Omit<T, "invoice"> & { statusAt?: string };
  return { ...rest, statusAt };
}
