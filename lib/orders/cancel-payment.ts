/**
 * REQ-0208 / REQ-0211 — refund Stripe + set paymentStatus refunded only when money
 * was collected (paid|partial). Confirmed+unpaid cancel keeps paymentStatus unpaid
 * (no refund; do not show Refunded badge).
 */

export function orderCancelShouldRefundPayment(
  paymentStatus: string | null | undefined,
  _orderStatus?: string | null | undefined,
): boolean {
  void _orderStatus;
  const pay = paymentStatus ?? "unpaid";
  return pay === "paid" || pay === "partial";
}
