/**
 * REQ-0114 — line share of order total when tax/shipping/discount adjust order.total.
 */

/** Proportional share of order.total for one line subtotal. */
export function computeProportionalLineAmount(
  itemSubtotal: number,
  orderSubtotal: number,
  orderTotal: number,
): number {
  if (orderSubtotal <= 0) return itemSubtotal;
  return (itemSubtotal / orderSubtotal) * orderTotal;
}

/** True when order-level fees/discount change the payable total. */
export function orderHasFeeAdjustments(
  orderSubtotal: number,
  orderTotal: number,
): boolean {
  return Math.abs(orderTotal - orderSubtotal) > 0.005;
}
