/**
 * REQ-0127 — pick the most relevant timestamp for recent-order status display.
 */

type OrderStatusDateInput = {
  status?: string | null;
  paymentStatus?: string | null;
  paidAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  shippedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

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
    return toIso(order.paidAt);
  }

  return undefined;
}
