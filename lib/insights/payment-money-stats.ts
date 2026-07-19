/**
 * REQ-0154 — Invoice-money-aware KPI partition for dashboard Revenue / Invoice cards.
 * Pure / client-safe. Does not invent invoice status "partial" — derived from amount fields.
 *
 * Revenue: Paid (fully settled collected) + Partial (mid-pay collected) + Due (open remainder)
 *   + Pending (fully unpaid draft/sent due) ≈ non-cancelled invoice money story.
 */

const EPS = 0.001;

export type PaymentMoneyInvoiceRow = {
  amountPaid?: number | null;
  amountDue?: number | null;
  total?: number | null;
  status?: string | null;
};

export type PaymentMoneyStats = {
  /** Σ amountPaid where fully settled (status paid or amountDue≈0, not cancelled) */
  paidCollected: number;
  /** Σ amountPaid where mid-pay (amountPaid>0 && amountDue>0) */
  partialCollected: number;
  /** Σ amountDue for open invoices (sent/draft/overdue) */
  dueOutstanding: number;
  /** Σ amountDue where amountPaid≈0 and status draft|sent */
  pendingUnpaidDue: number;
  paidInvoiceCount: number;
  partialInvoiceCount: number;
  /** draft|sent with amountPaid≈0 */
  pendingInvoiceCount: number;
};

function n(value: number | null | undefined): number {
  const v = Number(value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

/** True when invoice is mid-pay (collected some, still due). */
export function isPartialPayInvoice(inv: PaymentMoneyInvoiceRow): boolean {
  const paid = n(inv.amountPaid);
  const due = n(inv.amountDue);
  if (inv.status === "cancelled") return false;
  return paid > EPS && due > EPS;
}

/** True when fully settled for Paid badge money. */
export function isFullySettledInvoice(inv: PaymentMoneyInvoiceRow): boolean {
  if (inv.status === "cancelled") return false;
  if (inv.status === "paid") return true;
  return n(inv.amountDue) <= EPS && n(inv.amountPaid) > EPS;
}

/**
 * Build Paid / Partial / Due / Pending money + invoice counts from invoice rows.
 * Skips cancelled for money buckets (except counts of cancelled are not returned here).
 */
export function buildPaymentMoneyStats(
  invoices: PaymentMoneyInvoiceRow[],
): PaymentMoneyStats {
  let paidCollected = 0;
  let partialCollected = 0;
  let dueOutstanding = 0;
  let pendingUnpaidDue = 0;
  let paidInvoiceCount = 0;
  let partialInvoiceCount = 0;
  let pendingInvoiceCount = 0;

  for (const inv of invoices) {
    const status = (inv.status ?? "").toLowerCase();
    if (status === "cancelled") continue;

    const paid = Math.max(0, n(inv.amountPaid));
    const due = Math.max(0, n(inv.amountDue));
    const openStatus =
      status === "sent" || status === "draft" || status === "overdue";

    if (isFullySettledInvoice(inv)) {
      paidCollected += paid > EPS ? paid : Math.max(0, n(inv.total));
      paidInvoiceCount += 1;
      continue;
    }

    if (isPartialPayInvoice(inv)) {
      partialCollected += paid;
      partialInvoiceCount += 1;
      if (openStatus || due > EPS) {
        dueOutstanding += due;
      }
      continue;
    }

    // Fully unpaid open invoice
    if (openStatus) {
      dueOutstanding += due;
      if (paid <= EPS && (status === "draft" || status === "sent")) {
        pendingUnpaidDue += due;
        pendingInvoiceCount += 1;
      }
    }
  }

  return {
    paidCollected,
    partialCollected,
    dueOutstanding,
    pendingUnpaidDue,
    paidInvoiceCount,
    partialInvoiceCount,
    pendingInvoiceCount,
  };
}
