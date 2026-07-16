"use client";

/**
 * REQ-0145 — Order table Invoice # column cell.
 * Line 1: invoice # (copy + link) · created date
 * Line 2: amount due · due date · status badge
 */

import Link from "next/link";
import { Calendar, CircleDollarSign } from "lucide-react";
import { CopyableText, ClientDate } from "@/components/shared";
import { InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
import {
  dueDateSemanticKind,
  semanticDateClass,
} from "@/lib/ui/semantic-date-styles";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const META_MUTED = "text-xs text-gray-500 dark:text-gray-400";

export type OrderTableInvoiceCellProps = {
  invoice: NonNullable<Order["invoiceForOrder"]> | null | undefined;
  /** Same rule as OrderActions: /admin/invoices vs /invoices */
  invoiceHrefBase: string;
};

function isDueOverdue(
  dueDate: string | undefined,
  status: string | undefined,
): boolean {
  if (!dueDate) return status === "overdue";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today || status === "overdue";
}

export function OrderTableInvoiceCell({
  invoice,
  invoiceHrefBase,
}: OrderTableInvoiceCellProps) {
  if (!invoice) {
    return <span className={META_MUTED}>—</span>;
  }

  const href = `${invoiceHrefBase}/${invoice.id}`;
  const amountDue = invoice.amountDue ?? 0;
  const overdue = isDueOverdue(invoice.dueDate, invoice.status);

  return (
    <div className="flex flex-col gap-0.5 min-w-0 max-w-[220px]">
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        <CopyableText value={invoice.invoiceNumber}>
          <Link
            href={href}
            prefetch
            className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
          >
            {invoice.invoiceNumber}
          </Link>
        </CopyableText>
        {invoice.createdAt ? (
          <>
            <span className={META_MUTED} aria-hidden>
              ·
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                META_MUTED,
              )}
            >
              <Calendar className="h-3 w-3 shrink-0" aria-hidden />
              <ClientDate date={invoice.createdAt} className="text-xs" />
            </span>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-normal",
            amountDue > 0
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400",
          )}
        >
          <CircleDollarSign className="h-3 w-3 shrink-0" aria-hidden />$
          {amountDue.toFixed(2)}
        </span>
        {invoice.dueDate ? (
          <>
            <span className={META_MUTED} aria-hidden>
              ·
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                semanticDateClass(dueDateSemanticKind(overdue)),
              )}
            >
              <Calendar className="h-3 w-3 shrink-0" aria-hidden />
              <ClientDate
                date={invoice.dueDate}
                semantic={dueDateSemanticKind(overdue)}
                className="text-xs"
              />
            </span>
          </>
        ) : null}
        {invoice.status ? (
          <>
            <span className={META_MUTED} aria-hidden>
              ·
            </span>
            <InvoiceStatusBadge status={invoice.status} size="compact" />
          </>
        ) : null}
      </div>
    </div>
  );
}
