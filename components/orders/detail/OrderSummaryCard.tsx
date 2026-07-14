"use client";

import React from "react";
import {
  DollarSign,
  Receipt,
  Percent,
  Truck,
  Tag,
  CircleDollarSign,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DataSlotPulse } from "@/components/shared";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { DETAIL_DATA_VALUE_CLASS } from "@/lib/ui/typography-scale";
import { GlassCard, variantConfig } from "./order-detail-primitives";

export type OrderSummaryCardProps = {
  order?: Order;
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
    <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent">
      <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className={cn(DETAIL_DATA_VALUE_CLASS, valueClassName)}>
        {loading ? <DataSlotPulse variant="currency" /> : value}
      </span>
    </div>
  );
}

export function OrderSummaryCard({
  order,
  dataLoading,
}: OrderSummaryCardProps) {
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
          Order Summary
        </h3>
      </div>
      <div className="space-y-2">
        <SummaryRow
          icon={Receipt}
          label="Subtotal:"
          loading={dataLoading}
          value={`$${Number(order!.subtotal).toFixed(2)}`}
        />
        {!dataLoading && order!.tax != null && order!.tax > 0 && (
          <SummaryRow
            icon={Percent}
            label="Tax:"
            value={`$${Number(order!.tax).toFixed(2)}`}
          />
        )}
        {!dataLoading && order!.shipping != null && order!.shipping > 0 && (
          <SummaryRow
            icon={Truck}
            label="Shipping:"
            value={`$${Number(order!.shipping).toFixed(2)}`}
          />
        )}
        {!dataLoading && order!.discount != null && order!.discount > 0 && (
          <SummaryRow
            icon={Tag}
            label="Discount:"
            value={`-$${Number(order!.discount).toFixed(2)}`}
            valueClassName="text-rose-600 dark:text-rose-400"
          />
        )}
        <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
        <div className="flex justify-between text-sm sm:text-lg p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/20">
          <span className="text-gray-700 dark:text-white inline-flex items-center gap-1.5 font-normal">
            <CircleDollarSign className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Total:
          </span>
          <span className="font-normal text-emerald-600 dark:text-emerald-400">
            {dataLoading ? (
              <DataSlotPulse variant="currency" />
            ) : (
              `$${Number(order!.total).toFixed(2)}`
            )}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
