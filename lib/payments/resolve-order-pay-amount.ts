/**
 * REQ-0210 — Remaining charge for Pay dialog / Pay button.
 * Prefer invoice.amountDue when positive; else total − amountPaid so partial
 * rows never show $0.00 due while money is still outstanding.
 */

export type OrderPayAmountSource = {
  total?: number | null;
  invoiceForOrder?: {
    amountDue?: number | null;
    amountPaid?: number | null;
    total?: number | null;
  } | null;
};

export function resolveOrderPayAmount(order: OrderPayAmountSource): number {
  const docTotal = Number(
    order.invoiceForOrder?.total ?? order.total ?? 0,
  );
  const paid = Number(order.invoiceForOrder?.amountPaid ?? 0);
  const dueRaw = order.invoiceForOrder?.amountDue;
  if (dueRaw != null) {
    const due = Number(dueRaw);
    if (Number.isFinite(due) && due > 0) return due;
    // amountDue 0 with unpaid remainder → recompute (stale/zeroed cache)
    if (Number.isFinite(due) && due === 0 && paid > 0 && docTotal > paid) {
      return Math.max(0, docTotal - paid);
    }
    if (Number.isFinite(due) && due === 0) return 0;
  }
  return Math.max(0, docTotal - paid);
}
