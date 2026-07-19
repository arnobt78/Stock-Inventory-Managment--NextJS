/**
 * REQ-0156 — Shared Invoices KPI badges (store-wide / My Activity parity).
 * Paid → Partial → Pending → Overdue → Cancelled → Refunded (+ Self/Others).
 * Client-safe / pure. Partial/Pending counts are derived (not a DB status).
 */

export type StoreInvoiceStatusBadge = {
  label: string;
  value: number;
};

export type BuildStoreInvoiceStatusBadgesInput = {
  paidCount?: number;
  partialCount?: number;
  pendingCount?: number;
  overdueCount?: number;
  cancelledCount?: number;
  refundedCount?: number;
  selfOthers?: {
    invoiceSelfCount: number;
    invoiceOthersCount: number;
  } | null;
};

function n(value: number | undefined): number {
  const v = Number(value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

export function buildStoreInvoiceStatusBadges(
  input: BuildStoreInvoiceStatusBadgesInput,
): StoreInvoiceStatusBadge[] {
  const badges: StoreInvoiceStatusBadge[] = [
    { label: "Paid", value: n(input.paidCount) },
    { label: "Partial", value: n(input.partialCount) },
    { label: "Pending", value: n(input.pendingCount) },
    { label: "Overdue", value: n(input.overdueCount) },
    { label: "Cancelled", value: n(input.cancelledCount) },
    { label: "Refunded", value: n(input.refundedCount) },
  ];

  if (input.selfOthers) {
    badges.push(
      { label: "Self", value: n(input.selfOthers.invoiceSelfCount) },
      { label: "Others", value: n(input.selfOthers.invoiceOthersCount) },
    );
  }

  return badges;
}
