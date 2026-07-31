"use client";

/**
 * REQ-0145 — Order table Invoice # column cell.
 * REQ-0150 — also used by Invoice table Invoice # (same density).
 * Line 1: # · created (muted)
 * Line 2: amount · secondary event (due / paid / cancelled / refunded / sent) · status badge
 */

import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { CopyableText } from "@/components/shared";
import { SemanticEventDate } from "@/components/shared/SemanticEventDate";
import { InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
import {
  resolveInvoiceSecondaryEvent,
  type InvoiceEventSource,
} from "@/lib/orders/invoice-event-date";
import { cn } from "@/lib/utils";

const META_MUTED = "text-xs text-gray-600 dark:text-gray-300";

/** Minimal invoice shape for dense list cells (order.invoiceForOrder or Invoice list row). */
export type InvoiceTableCellInvoice = InvoiceEventSource & {
  id: string;
  invoiceNumber: string;
  amountDue?: number | null;
  createdAt?: string | null;
};

export type OrderTableInvoiceCellProps = {
  invoice: InvoiceTableCellInvoice | null | undefined;
  /** Same rule as OrderActions: /admin/invoices vs /invoices */
  invoiceHrefBase: string;
};

export function OrderTableInvoiceCell({
  invoice,
  invoiceHrefBase,
}: OrderTableInvoiceCellProps) {
  if (!invoice) {
    return <span className={META_MUTED}>—</span>;
  }

  const href = `${invoiceHrefBase}/${invoice.id}`;
  const amountDue = invoice.amountDue ?? 0;
  const secondary = resolveInvoiceSecondaryEvent(invoice);

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
        <CopyableText value={invoice.invoiceNumber}>
          <Link
            href={href}
            prefetch
            className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 shrink-0"
          >
            {invoice.invoiceNumber}
          </Link>
        </CopyableText>
        {invoice.createdAt ? (
          <>
            <span className={cn(META_MUTED, "shrink-0")} aria-hidden>
              ·
            </span>
            <SemanticEventDate
              date={invoice.createdAt}
              kind="created"
              mode="date"
            />
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-normal shrink-0",
            amountDue > 0
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400",
          )}
        >
          <CircleDollarSign className="h-3 w-3 shrink-0" aria-hidden />$
          {amountDue.toFixed(2)}
        </span>
        {secondary ? (
          <>
            <span className={cn(META_MUTED, "shrink-0")} aria-hidden>
              ·
            </span>
            <SemanticEventDate
              date={secondary.date}
              kind={secondary.kind}
              mode="date"
            />
          </>
        ) : null}
        {invoice.status ? (
          <>
            <span className={cn(META_MUTED, "shrink-0")} aria-hidden>
              ·
            </span>
            <span className="shrink-0">
              <InvoiceStatusBadge status={invoice.status} size="compact" />
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
