"use client";

/**
 * REQ-0162 / REQ-0164 — Invoice Summary beside Order Items.
 * Meaningful icon hues (Order Summary parity).
 */

import React from "react";
import {
  DollarSign,
  Receipt,
  Percent,
  Truck,
  Tag,
  CircleDollarSign,
  Wallet,
  Banknote,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DataSlotPulse, SectionCardHeader } from "@/components/shared";
import type { Invoice } from "@/types";
import { cn } from "@/lib/utils";
import { TYPO_CARD_TITLE } from "@/lib/ui/typography-scale";
import { GlassCard } from "@/components/orders/detail/order-detail-primitives";

export type InvoiceSummaryCardProps = {
  invoice?: Invoice;
  dataLoading: boolean;
};

/** Shared summary row — exported for PaymentDialog (REQ-0126). */
export function InvoiceSummaryRow({
  icon: Icon,
  label,
  value,
  valueClassName,
  iconClassName,
  loading,
  variant = "teal",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  /** REQ-0164 — semantic icon hue */
  iconClassName?: string;
  loading?: boolean;
  variant?: "teal" | "glass";
}) {
  const rowClass =
    variant === "glass"
      ? "flex justify-between items-center text-sm p-2 rounded-lg bg-white/5"
      : "flex justify-between items-center text-sm p-2 rounded-lg bg-gradient-to-r from-teal-100/40 via-teal-50/20 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent";

  return (
    <div className={rowClass}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          variant === "glass"
            ? "text-white/80"
            : "text-gray-600 dark:text-gray-300",
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            iconClassName,
            variant === "glass" && !iconClassName && "text-white/80",
          )}
        />
        {label}
      </span>
      <span
        className={cn(
          "font-medium",
          variant === "glass" ? "text-white" : "text-gray-700 dark:text-white",
          valueClassName,
        )}
      >
        {loading ? <DataSlotPulse variant="currency" /> : value}
      </span>
    </div>
  );
}

function SummaryRow(
  props: Omit<React.ComponentProps<typeof InvoiceSummaryRow>, "variant">,
) {
  return <InvoiceSummaryRow {...props} />;
}

export function InvoiceSummaryCard({
  invoice,
  dataLoading,
}: InvoiceSummaryCardProps) {
  const amountDue = Number(invoice?.amountDue ?? 0);
  // REQ-0210 — cancelled/refunded: collected history, not "paid in full"
  const isClosed =
    invoice?.status === "cancelled" ||
    invoice?.linkedOrderPaymentStatus === "refunded";

  return (
    <GlassCard variant="teal" className="h-full">
      <SectionCardHeader
        title="Invoice Summary"
        icon={DollarSign}
        tone="teal"
        className="mb-4"
        titleClassName={cn(TYPO_CARD_TITLE, "text-gray-700 dark:text-white")}
      />
      <div className="space-y-2">
        <SummaryRow
          icon={Receipt}
          label="Subtotal:"
          loading={dataLoading}
          iconClassName="text-sky-600 dark:text-sky-400"
          value={`$${Number(invoice?.subtotal ?? 0).toFixed(2)}`}
        />
        {!dataLoading && invoice?.tax != null && invoice.tax > 0 && (
          <SummaryRow
            icon={Percent}
            label="Tax:"
            iconClassName="text-violet-600 dark:text-violet-400"
            value={`$${Number(invoice.tax).toFixed(2)}`}
          />
        )}
        {!dataLoading && invoice?.shipping != null && invoice.shipping > 0 && (
          <SummaryRow
            icon={Truck}
            label="Shipping:"
            iconClassName="text-cyan-600 dark:text-cyan-400"
            value={`$${Number(invoice.shipping).toFixed(2)}`}
          />
        )}
        {!dataLoading && invoice?.discount != null && invoice.discount > 0 && (
          <SummaryRow
            icon={Tag}
            label="Discount:"
            iconClassName="text-rose-600 dark:text-rose-400"
            value={`-$${Number(invoice.discount).toFixed(2)}`}
            valueClassName="text-rose-600 dark:text-rose-400"
          />
        )}
        <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
        {/* REQ-0148 / REQ-0164 — Total + emerald icon (OrderSummaryCard parity) */}
        <div className="flex justify-between text-sm sm:text-base font-normal p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/20">
          <span className="text-gray-700 dark:text-white inline-flex items-center gap-1.5">
            <CircleDollarSign className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Total:
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-normal">
            {dataLoading ? (
              <DataSlotPulse variant="currency" />
            ) : (
              `$${Number(invoice!.total).toFixed(2)}`
            )}
          </span>
        </div>
        <SummaryRow
          icon={Wallet}
          label={isClosed ? "Collected:" : "Amount Paid:"}
          loading={dataLoading}
          iconClassName={
            isClosed
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
          value={`$${Number(invoice?.amountPaid ?? 0).toFixed(2)}`}
          valueClassName={
            isClosed
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
        />
        <SummaryRow
          icon={Banknote}
          label={isClosed ? "Balance Closed:" : "Amount Due:"}
          loading={dataLoading}
          iconClassName={
            isClosed
              ? "text-rose-600 dark:text-rose-400"
              : amountDue > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          }
          value={`$${amountDue.toFixed(2)}`}
          valueClassName={
            isClosed
              ? "text-rose-600 dark:text-rose-400"
              : amountDue > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          }
        />
      </div>
    </GlassCard>
  );
}
