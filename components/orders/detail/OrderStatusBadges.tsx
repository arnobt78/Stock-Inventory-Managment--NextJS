"use client";

/**
 * REQ-0146 — `layout="stack"` when tracking sibling needs equal-height column.
 */

import React from "react";
import { ClipboardList, Wallet } from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import type { OrderStatus, PaymentStatus } from "@/types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import { cn } from "@/lib/utils";
import { GlassCard } from "./order-detail-primitives";

export type OrderStatusBadgesProps = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dataLoading: boolean;
  statusControl?: React.ReactNode;
  /** grid = side-by-side; stack = vertical fill for tracking column (REQ-0146) */
  layout?: "grid" | "stack";
  className?: string;
};

export function OrderStatusBadges({
  status,
  paymentStatus,
  dataLoading,
  statusControl,
  layout = "grid",
  className,
}: OrderStatusBadgesProps) {
  return (
    <div
      className={cn(
        "gap-2",
        layout === "stack"
          ? "flex flex-col h-full min-h-0"
          : "grid grid-cols-1 md:grid-cols-2",
        className,
      )}
    >
      <GlassCard
        variant="amber"
        className={cn(
          layout === "stack" && "flex-1 flex flex-col justify-center",
        )}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/80 mb-3 inline-flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          Order Status
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {dataLoading ? (
            <DataSlotPulse variant="badge" className="h-7 w-20 rounded-full" />
          ) : (
            <OrderStatusBadge status={status!} className="text-sm" />
          )}
          {!dataLoading && statusControl}
        </div>
      </GlassCard>
      <GlassCard
        variant="emerald"
        className={cn(
          layout === "stack" && "flex-1 flex flex-col justify-center",
        )}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/80 mb-3 inline-flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          Payment Status
        </p>
        {dataLoading ? (
          <DataSlotPulse variant="badge" className="h-7 w-20 rounded-full" />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <PaymentStatusBadge status={paymentStatus!} className="text-sm" />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
