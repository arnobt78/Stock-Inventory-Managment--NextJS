"use client";

import React from "react";
import { DataSlotPulse } from "@/components/shared";
import type { OrderStatus, PaymentStatus } from "@/types";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/lib/ui/semantic-badges";
import { GlassCard } from "./order-detail-primitives";

export type OrderStatusBadgesProps = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dataLoading: boolean;
  statusControl?: React.ReactNode;
};

export function OrderStatusBadges({
  status,
  paymentStatus,
  dataLoading,
  statusControl,
}: OrderStatusBadgesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <GlassCard variant="amber">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
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
      <GlassCard variant="emerald">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
          Payment Status
        </p>
        {dataLoading ? (
          <DataSlotPulse variant="badge" className="h-7 w-20 rounded-full" />
        ) : (
          <PaymentStatusBadge status={paymentStatus!} className="text-sm" />
        )}
      </GlassCard>
    </div>
  );
}
