/**
 * REQ-0150 — resolve statusAt + semantic kind for invoice list Status column.
 * Client-safe — no server imports.
 */

import type { SemanticDateKind } from "@/lib/ui/semantic-date-styles";

export type InvoiceStatusAtSource = {
  status?: string | null;
  createdAt?: string | Date | null;
  issuedAt?: string | Date | null;
  dueDate?: string | Date | null;
  sentAt?: string | Date | null;
  paidAt?: string | Date | null;
  cancelledAt?: string | Date | null;
};

function toIso(value: string | Date | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    return value.length > 0 ? value : undefined;
  }
  try {
    return value.toISOString();
  } catch {
    return undefined;
  }
}

function isDueOverdue(dueDate: string, status?: string | null): boolean {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today || status === "overdue";
}

/** Semantic color for invoice statusAt under the Status badge. */
export function invoiceStatusAtSemanticKind(
  status?: string | null,
): SemanticDateKind {
  const st = (status ?? "").toLowerCase();
  if (st === "paid") return "paid";
  if (st === "cancelled") return "cancelled";
  if (st === "overdue") return "overdue";
  if (st === "sent") return "sent";
  if (st === "draft") return "created";
  return "updated";
}

/**
 * Terminal / relevant timestamp for Status column:
 * paid→paidAt; cancelled→cancelledAt; overdue→dueDate; sent→sentAt|dueDate; draft→issuedAt|createdAt.
 */
export function resolveInvoiceStatusAt(
  inv: InvoiceStatusAtSource,
): string | undefined {
  const st = (inv.status ?? "").toLowerCase();
  const paidAt = toIso(inv.paidAt);
  const cancelledAt = toIso(inv.cancelledAt);
  const sentAt = toIso(inv.sentAt);
  const dueDate = toIso(inv.dueDate);
  const issuedAt = toIso(inv.issuedAt);
  const createdAt = toIso(inv.createdAt);

  if (st === "paid" && paidAt) return paidAt;
  if (st === "cancelled" && cancelledAt) return cancelledAt;
  if (st === "overdue" && dueDate) return dueDate;
  if (st === "sent") {
    if (sentAt) return sentAt;
    if (dueDate) return dueDate;
  }
  if (st === "draft") return issuedAt ?? createdAt;
  if (dueDate && isDueOverdue(dueDate, st)) return dueDate;
  return sentAt ?? dueDate ?? issuedAt ?? createdAt;
}
