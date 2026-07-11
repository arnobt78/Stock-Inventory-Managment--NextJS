"use client";

import React from "react";
import { Package } from "lucide-react";
import { DataSlotPulse, ProductLineItemsList } from "@/components/shared";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { GlassCard, variantConfig } from "./order-detail-primitives";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";

export type OrderItemsCardProps = {
  order?: Order;
  dataLoading: boolean;
  linkMode: "admin" | "none";
  /** REQ-0026 — batch SSR review context keyed by productId */
  initialReviewContext?: OrderReviewContext;
};

export function OrderItemsCard({
  order,
  dataLoading,
  linkMode,
  initialReviewContext,
}: OrderItemsCardProps) {
  const itemCount = order?.items?.length ?? 0;

  return (
    <GlassCard variant="sky">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "p-2 rounded-xl border",
            variantConfig.sky.iconBg,
            "dark:border-sky-400/30 dark:bg-sky-500/20",
          )}
        >
          <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
            Order Items
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {dataLoading ? (
              <DataSlotPulse variant="text-sm" className="w-28" />
            ) : (
              <>
                {itemCount} item{itemCount !== 1 ? "s" : ""} in this order
              </>
            )}
          </p>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {dataLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
            >
              <div className="flex-1 space-y-2">
                <DataSlotPulse variant="text-md" className="w-40" />
                <DataSlotPulse variant="text-sm" className="w-24" />
              </div>
              <DataSlotPulse variant="currency" />
            </div>
          ))
        ) : (
          <ProductLineItemsList
            items={order?.items ?? []}
            linkMode={linkMode}
            emptyMessage="No items in this order"
            showReviews
            order={order}
            initialReviewContext={initialReviewContext}
          />
        )}
      </div>
    </GlassCard>
  );
}
