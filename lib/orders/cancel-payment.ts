/**
 * REQ-0208 gap — when cancelling an order, whether money was collected and must be refunded.
 * Includes `partial` (amountPaid > 0) so pending+partial cancels set paymentStatus to refunded.
 */

export function orderCancelShouldRefundPayment(
  paymentStatus: string | null | undefined,
  orderStatus: string | null | undefined,
): boolean {
  const pay = paymentStatus ?? "unpaid";
  const status = orderStatus ?? "pending";
  return (
    pay === "paid" ||
    pay === "partial" ||
    status === "confirmed" ||
    status === "processing" ||
    status === "shipped" ||
    status === "delivered"
  );
}
