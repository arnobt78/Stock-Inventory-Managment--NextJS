/**
 * REQ-0130 — semantic text colors for date values (light + dark).
 * Use via ClientDateTime / ClientCompactDateTime / ClientDate `semantic` prop.
 */

import { cn } from "@/lib/utils";
import { TYPO_BODY_MUTED } from "@/lib/ui/typography-scale";

export type SemanticDateKind =
  | "created"
  | "updated"
  | "expiration"
  | "due"
  | "paid"
  | "cancelled"
  | "refunded"
  | "shipped"
  | "delivered"
  | "sent"
  | "overdue"
  | "scheduled"
  | "completed";

const SEMANTIC_DATE_CLASSES: Record<SemanticDateKind, string> = {
  created: "text-sky-600 dark:text-sky-400",
  updated: "text-violet-600 dark:text-violet-400",
  expiration: "text-amber-600 dark:text-amber-400",
  due: "text-orange-600 dark:text-orange-400",
  paid: "text-emerald-600 dark:text-emerald-400",
  cancelled: "text-rose-600 dark:text-rose-400",
  refunded: "text-fuchsia-600 dark:text-fuchsia-400",
  shipped: "text-cyan-600 dark:text-cyan-400",
  delivered: "text-teal-600 dark:text-teal-400",
  sent: "text-indigo-600 dark:text-indigo-400",
  overdue: "text-red-600 dark:text-red-400",
  scheduled: "text-blue-600 dark:text-blue-400",
  completed: "text-emerald-600 dark:text-emerald-400",
};

/** Tailwind classes for a semantic date kind; falls back to muted body when kind omitted. */
export function semanticDateClass(
  kind?: SemanticDateKind,
  className?: string,
): string {
  return cn(kind ? SEMANTIC_DATE_CLASSES[kind] : TYPO_BODY_MUTED, className);
}

/** Map order statusAt context to a semantic date color. */
export function statusAtSemanticKind(
  status?: string | null,
  paymentStatus?: string | null,
): SemanticDateKind {
  const st = status?.toLowerCase();
  const ps = paymentStatus?.toLowerCase();
  if (ps === "refunded") return "refunded";
  if (st === "cancelled") return "cancelled";
  if (st === "delivered") return "delivered";
  if (st === "shipped") return "shipped";
  if (ps === "paid" || ps === "partial" || st === "paid") return "paid";
  return "updated";
}

/** Due date row — overdue vs upcoming. */
export function dueDateSemanticKind(isOverdue: boolean): SemanticDateKind {
  return isOverdue ? "overdue" : "due";
}
