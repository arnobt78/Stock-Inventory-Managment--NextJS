"use client";

/**
 * REQ-0162 / REQ-0163 — Order Items on invoice detail (OrderItemsCard parity).
 * Subtitle count + issued/created date; relatedOrder meta chip; SSR review context.
 */

import React from "react";
import { Package } from "lucide-react";
import {
  ClientDateTime,
  DataSlotPulse,
  ProductLineItemsList,
  SectionCardHeader,
} from "@/components/shared";
import type { Invoice } from "@/types";
import { cn } from "@/lib/utils";
import { TYPO_CARD_TITLE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { GlassCard } from "@/components/orders/detail/order-detail-primitives";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";

export type InvoiceItemsCardProps = {
  invoice?: Invoice;
  dataLoading: boolean;
  linkMode: "admin" | "portal" | "none";
  warehouseLinkMode?: "admin" | "owner" | "none";
  /** REQ-0163 — batch SSR reviews/eligibility (avoids compact Loader2 hydrate) */
  initialReviewContext?: OrderReviewContext;
  className?: string;
};

export function InvoiceItemsCard({
  invoice,
  dataLoading,
  linkMode,
  warehouseLinkMode = "none",
  initialReviewContext,
  className,
}: InvoiceItemsCardProps) {
  const itemCount = invoice?.linkedOrderItems?.length ?? 0;
  const shouldShow =
    dataLoading || (invoice?.linkedOrderItems != null && itemCount > 0);

  if (!shouldShow) return null;

  const subtitleDate = invoice?.issuedAt ?? invoice?.createdAt;

  const description = dataLoading ? (
    <DataSlotPulse variant="text-sm" className="w-28" />
  ) : (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span>
        {itemCount} item{itemCount !== 1 ? "s" : ""} on this invoice
      </span>
      {subtitleDate ? (
        <>
          <span className="text-gray-400" aria-hidden>
            ·
          </span>
          <ClientDateTime
            date={new Date(subtitleDate)}
            semantic="created"
          />
        </>
      ) : null}
    </span>
  );

  const relatedOrder =
    invoice?.orderId && invoice.linkedOrderNumber
      ? { id: invoice.orderId, orderNumber: invoice.linkedOrderNumber }
      : null;

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
            items={invoice!.linkedOrderItems ?? []}
            linkMode={linkMode}
            warehouseLinkMode={warehouseLinkMode}
            orderSubtotal={invoice!.subtotal}
            orderTotal={invoice!.total}
            showReviews={invoice!.status === "paid"}
            relatedOrder={relatedOrder}
            initialReviewContext={initialReviewContext}
            order={{
              id: invoice!.orderId,
              // Prefer linked order payment (partial), else derive from money
              paymentStatus: (invoice!.linkedOrderPaymentStatus ??
                (invoice!.status === "paid"
                  ? "paid"
                  : invoice!.amountPaid > 0
                    ? "partial"
                    : "unpaid")) as
                | "paid"
                | "unpaid"
                | "partial"
                | "refunded",
            }}
            emptyMessage="No items on linked order"
          />
        )}
      </div>
    </GlassCard>
  );
}
