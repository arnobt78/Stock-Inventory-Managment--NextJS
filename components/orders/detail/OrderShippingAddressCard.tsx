"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import {
  formatAddress,
  GlassCard,
  variantConfig,
} from "./order-detail-primitives";

export type OrderShippingAddressCardProps = {
  order?: Order;
  dataLoading: boolean;
};

export function OrderShippingAddressCard({
  order,
  dataLoading,
}: OrderShippingAddressCardProps) {
  if (!dataLoading && !order?.shippingAddress) return null;

  return (
    <GlassCard variant="violet">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "p-2 rounded-xl border",
            variantConfig.violet.iconBg,
            "dark:border-violet-400/30 dark:bg-violet-500/20",
          )}
        >
          <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
          Shipping Address
        </h3>
      </div>
      <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10">
        {dataLoading ? (
          <DataSlotPulse variant="text-md" className="w-full" />
        ) : (
          formatAddress(order!.shippingAddress)
        )}
      </p>
    </GlassCard>
  );
}
