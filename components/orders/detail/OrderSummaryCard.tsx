"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DataSlotPulse } from "@/components/shared";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { GlassCard, variantConfig } from "./order-detail-primitives";

export type OrderSummaryCardProps = {
  order?: Order;
  dataLoading: boolean;
};

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
        <h3 className="text-lg font-medium text-gray-700 dark:text-white">
          Order Summary
        </h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent">
          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span className="font-medium text-gray-700 dark:text-white">
            {dataLoading ? (
              <DataSlotPulse variant="currency" />
            ) : (
              `$${Number(order!.subtotal).toFixed(2)}`
            )}
          </span>
        </div>
        {!dataLoading && order!.tax != null && order!.tax > 0 && (
          <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-amber-100/40 via-amber-50/20 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent">
            <span className="text-gray-600 dark:text-gray-400">Tax:</span>
            <span className="font-medium text-gray-700 dark:text-white">
              ${Number(order!.tax).toFixed(2)}
            </span>
          </div>
        )}
        {!dataLoading && order!.shipping != null && order!.shipping > 0 && (
          <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent">
            <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
            <span className="font-medium text-gray-700 dark:text-white">
              ${Number(order!.shipping).toFixed(2)}
            </span>
          </div>
        )}
        {!dataLoading && order!.discount != null && order!.discount > 0 && (
          <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-rose-100/40 via-rose-50/20 to-transparent dark:from-rose-500/10 dark:via-rose-500/5 dark:to-transparent">
            <span className="text-gray-600 dark:text-gray-400">Discount:</span>
            <span className="font-medium text-rose-600 dark:text-rose-400">
              -${Number(order!.discount).toFixed(2)}
            </span>
          </div>
        )}
        <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
        <div className="flex justify-between text-lg font-medium p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/20">
          <span className="text-gray-700 dark:text-white">Total:</span>
          <span className="text-emerald-600 dark:text-emerald-400">
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
