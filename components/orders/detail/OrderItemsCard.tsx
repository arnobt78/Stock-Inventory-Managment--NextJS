"use client";

/**
 * REQ-0147 — Items card subtitle is count + created only (invoice lives in Order Information).
 * REQ-0148 — pass full order so ProductLineItemsList can render invoice meta chip.
 */

import React from "react";
import { Package } from "lucide-react";
import {
  ClientDateTime,
  DataSlotPulse,
  ProductLineItemsList,
  SectionCardHeader,
} from "@/components/shared";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { TYPO_CARD_TITLE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { GlassCard } from "./order-detail-primitives";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";

export type OrderItemsCardProps = {
  order?: Order;
  dataLoading: boolean;
  linkMode: "admin" | "portal" | "none";
  warehouseLinkMode?: "admin" | "owner" | "none";
  /** REQ-0026 — batch SSR review context keyed by productId */
  initialReviewContext?: OrderReviewContext;
  className?: string;
};

export function OrderItemsCard({
  order,
  dataLoading,
  linkMode,
  warehouseLinkMode = "none",
  initialReviewContext,
  className,
}: OrderItemsCardProps) {
  const itemCount = order?.items?.length ?? 0;

  const description = dataLoading ? (
    <DataSlotPulse variant="text-sm" className="w-28" />
  ) : (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span>
        {itemCount} item{itemCount !== 1 ? "s" : ""} in this order
      </span>
      {order?.createdAt ? (
        <>
          <span className="text-gray-400" aria-hidden>
            ·
          </span>
          <ClientDateTime date={new Date(order.createdAt)} semantic="created" />
        </>
      ) : null}
    </span>
  );

  return (
    <GlassCard variant="sky" className={cn("h-full", className)}>
      <SectionCardHeader
        title="Order Items"
        description={description}
        icon={Package}
        tone="sky"
        className="mb-2"
        titleClassName={cn(TYPO_CARD_TITLE, "text-gray-700 dark:text-white")}
        descriptionClassName={cn(
          TYPO_SUBTITLE,
          "text-gray-600 dark:text-gray-300",
        )}
      />
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
            warehouseLinkMode={warehouseLinkMode}
            orderSubtotal={order?.subtotal}
            orderTotal={order?.total}
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
