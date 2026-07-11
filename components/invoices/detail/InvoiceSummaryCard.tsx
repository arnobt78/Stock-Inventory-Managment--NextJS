"use client";

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
import { DataSlotPulse } from "@/components/shared";
import type { Invoice } from "@/types";
import { cn } from "@/lib/utils";
import { GlassCard, variantConfig } from "@/components/orders/detail/order-detail-primitives";

export type InvoiceSummaryCardProps = {
  invoice?: Invoice;
  dataLoading: boolean;
};

function SummaryRow({
  icon: Icon,
  label,
  value,
  valueClassName,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-gradient-to-r from-teal-100/40 via-teal-50/20 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent">
      <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className={cn("font-medium text-gray-700 dark:text-white", valueClassName)}>
        {loading ? <DataSlotPulse variant="currency" /> : value}
      </span>
    </div>
  );
}

export function InvoiceSummaryCard({
  invoice,
  dataLoading,
}: InvoiceSummaryCardProps) {
  return (
    <GlassCard variant="teal">
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "p-2 rounded-xl border",
            variantConfig.teal.iconBg,
            "dark:border-teal-400/30 dark:bg-teal-500/20",
          )}
        >
          <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
          Invoice Summary
        </h3>
      </div>
      <div className="space-y-2">
        <SummaryRow
          icon={Receipt}
          label="Subtotal:"
          loading={dataLoading}
          value={`$${Number(invoice?.subtotal ?? 0).toFixed(2)}`}
        />
        {!dataLoading && invoice?.tax != null && invoice.tax > 0 && (
          <SummaryRow
            icon={Percent}
            label="Tax:"
            value={`$${Number(invoice.tax).toFixed(2)}`}
          />
        )}
        {!dataLoading && invoice?.shipping != null && invoice.shipping > 0 && (
          <SummaryRow
            icon={Truck}
            label="Shipping:"
            value={`$${Number(invoice.shipping).toFixed(2)}`}
          />
        )}
        {!dataLoading && invoice?.discount != null && invoice.discount > 0 && (
          <SummaryRow
            icon={Tag}
            label="Discount:"
            value={`-$${Number(invoice.discount).toFixed(2)}`}
            valueClassName="text-rose-600 dark:text-rose-400"
          />
        )}
        <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
        <div className="flex justify-between text-sm sm:text-lg font-medium p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/20">
          <span className="text-gray-700 dark:text-white inline-flex items-center gap-1.5">
            <CircleDollarSign className="h-4 w-4 shrink-0" />
            Total:
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {dataLoading ? (
              <DataSlotPulse variant="currency" />
            ) : (
              `$${Number(invoice!.total).toFixed(2)}`
            )}
          </span>
        </div>
        <SummaryRow
          icon={Wallet}
          label="Amount Paid:"
          loading={dataLoading}
          value={`$${Number(invoice?.amountPaid ?? 0).toFixed(2)}`}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryRow
          icon={Banknote}
          label="Amount Due:"
          loading={dataLoading}
          value={`$${Number(invoice?.amountDue ?? 0).toFixed(2)}`}
          valueClassName={
            (invoice?.amountDue ?? 0) > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
        />
      </div>
    </GlassCard>
  );
}
