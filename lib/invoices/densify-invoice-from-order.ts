/**
 * REQ-0211 — Merge linked-order densify onto an invoice create/update row
 * from a cached Order (detail or list). Keeps Invoice table Order # / badges
 * instant before invalidate refetch returns the enriched GET list shape.
 */

import type { Invoice, Order } from "@/types";

export function densifyInvoiceFromOrder(
  invoice: Invoice,
  order: Order | null | undefined,
): Invoice {
  if (!order) return invoice;
  if (invoice.linkedOrderNumber && invoice.linkedOrderStatus != null) {
    return invoice;
  }
  const orderCreatedAt =
    typeof order.createdAt === "string"
      ? order.createdAt
      : order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : null;
  const statusAt = (order as Order & { statusAt?: string | null }).statusAt;

  return {
    ...invoice,
    linkedOrderNumber: invoice.linkedOrderNumber ?? order.orderNumber ?? null,
    linkedOrderCreatedAt: invoice.linkedOrderCreatedAt ?? orderCreatedAt,
    linkedOrderItems: invoice.linkedOrderItems ?? order.items ?? [],
    linkedOrderStatus: invoice.linkedOrderStatus ?? order.status ?? null,
    linkedOrderPaymentStatus:
      invoice.linkedOrderPaymentStatus ?? order.paymentStatus ?? null,
    linkedOrderStatusAt: invoice.linkedOrderStatusAt ?? statusAt ?? null,
    orderUserId: invoice.orderUserId ?? order.userId ?? null,
  };
}
