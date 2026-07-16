/**
 * REQ-0140 — which order lines count toward "Total Quantity Sold" / revenue / demand velocity.
 * Pending/unpaid reservations are stock commits, not completed sales.
 */

export type OrderSalesStatusFields = {
  status?: string | null;
  paymentStatus?: string | null;
};

/**
 * Count as sold when delivered or payment is paid.
 * Excludes pending, cancelled, unpaid, and refund paths.
 */
export function isOrderCountedAsSold(
  status?: string | null,
  paymentStatus?: string | null,
): boolean {
  const s = (status ?? "").toLowerCase();
  const pay = (paymentStatus ?? "").toLowerCase();
  if (s === "cancelled" || s === "refund" || pay === "refunded") {
    return false;
  }
  return s === "delivered" || pay === "paid";
}

/** Convenience for order-shaped objects from Prisma selects. */
export function isOrderRecordCountedAsSold(
  order: OrderSalesStatusFields | null | undefined,
): boolean {
  if (!order) return false;
  return isOrderCountedAsSold(order.status, order.paymentStatus);
}
