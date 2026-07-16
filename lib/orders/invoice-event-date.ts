/**
 * REQ-0145 — pick the most relevant invoice event date + semantic kind for list cells.
 * Client-safe.
 */

import type { SemanticDateKind } from "@/lib/ui/semantic-date-styles";
import { dueDateSemanticKind } from "@/lib/ui/semantic-date-styles";

export type InvoiceEventSource = {
  status?: string | null;
  createdAt?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  sentAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string | null;
};

export type InvoiceEventDate = {
  date: string;
  kind: SemanticDateKind;
};

function isDueOverdue(dueDate: string, status?: string | null): boolean {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today || status === "overdue";
}

/**
 * Secondary invoice date for line 2: paid → paidAt; cancelled → cancelledAt;
 * refunded → paidAt/updatedAt; else due (or sent when no due).
 */
export function resolveInvoiceSecondaryEvent(
  inv: InvoiceEventSource,
): InvoiceEventDate | null {
  const st = (inv.status ?? "").toLowerCase();

  if (st === "paid" && inv.paidAt) {
    return { date: inv.paidAt, kind: "paid" };
  }
  if (st === "cancelled" && inv.cancelledAt) {
    return { date: inv.cancelledAt, kind: "cancelled" };
  }
  if (st === "refunded") {
    if (inv.paidAt) return { date: inv.paidAt, kind: "refunded" };
    if (inv.updatedAt) return { date: inv.updatedAt, kind: "refunded" };
  }
  if (st === "sent" && inv.sentAt) {
    // Prefer due when present (amount-due context); sent shown via badge
    if (inv.dueDate) {
      return {
        date: inv.dueDate,
        kind: dueDateSemanticKind(isDueOverdue(inv.dueDate, st)),
      };
    }
    return { date: inv.sentAt, kind: "sent" };
  }
  if (inv.dueDate) {
    return {
      date: inv.dueDate,
      kind: dueDateSemanticKind(isDueOverdue(inv.dueDate, st)),
    };
  }
  if (inv.sentAt) return { date: inv.sentAt, kind: "sent" };
  return null;
}
