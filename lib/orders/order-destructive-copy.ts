/**
 * REQ-0209 — Shared confirm-dialog copy for Cancel Order vs Process Refund.
 * Unpaid/partial → Cancel (partial mentions Stripe refund of amount already paid).
 * Fully paid → Process Refund (cancel + full refund). Same DELETE API underneath.
 */

import type { Order } from "@/types";

/** Amount already collected (invoice money preferred). */
export function getOrderAmountPaidForDestructiveCopy(
  order: Pick<Order, "total" | "invoiceForOrder"> & {
    amountPaid?: number | null;
  },
): number {
  const fromInvoice = order.invoiceForOrder?.amountPaid;
  if (fromInvoice != null && Number.isFinite(Number(fromInvoice))) {
    return Math.max(0, Number(fromInvoice));
  }
  if (order.amountPaid != null && Number.isFinite(Number(order.amountPaid))) {
    return Math.max(0, Number(order.amountPaid));
  }
  return 0;
}

/** Cancel Order dialog body — unpaid vs partial (refund already paid). */
export function getOrderCancelConfirmDescription(
  order: Pick<Order, "orderNumber" | "paymentStatus" | "total" | "invoiceForOrder"> & {
    amountPaid?: number | null;
  },
): string {
  const paid = getOrderAmountPaidForDestructiveCopy(order);
  if (order.paymentStatus === "partial" && paid > 0) {
    return `Cancel order ${order.orderNumber} and refund $${paid.toFixed(2)} already paid? Stock will be restored and the linked invoice cancelled. This cannot be undone.`;
  }
  return `Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`;
}

/** Process Refund dialog body — full paid cancel + Stripe refund. */
export function getOrderRefundConfirmDescription(
  order: Pick<Order, "orderNumber" | "total" | "invoiceForOrder"> & {
    amountPaid?: number | null;
  },
): string {
  const paid = getOrderAmountPaidForDestructiveCopy(order);
  const amount =
    paid > 0
      ? paid
      : order.total != null && Number.isFinite(Number(order.total))
        ? Number(order.total)
        : 0;
  return `Cancel order ${order.orderNumber} and refund $${amount.toFixed(2)} via Stripe? Stock will be restored and the linked invoice cancelled. This cannot be undone.`;
}
