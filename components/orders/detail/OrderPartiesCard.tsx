"use client";

import React from "react";
import { Package } from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import {
  GlassCard,
  getCustomerDisplay,
  getCustomerEmail,
  variantConfig,
} from "./order-detail-primitives";

export type OrderPartiesCardProps = {
  order?: Order;
  dataLoading: boolean;
};

export function OrderPartiesCard({
  order,
  dataLoading,
}: OrderPartiesCardProps) {
  const shouldShow =
    dataLoading ||
    order?.placedByName != null ||
    order?.placedByEmail != null ||
    (order?.orderProductOwners && order.orderProductOwners.length > 0);

  if (!shouldShow) return null;

  const customerEmail = order ? getCustomerEmail(order) : "—";

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
          <Package className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
          Parties &amp; roles
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
            Ordered by
          </p>
          <p className="text-gray-700 dark:text-white">
            {dataLoading ? (
              <DataSlotPulse variant="text-md" className="w-36" />
            ) : (
              (order!.placedByName ?? "—")
            )}
          </p>
          {!dataLoading && order!.placedByEmail && (
            <span className="text-gray-600 dark:text-gray-400 block text-xs">
              {order!.placedByEmail}
            </span>
          )}
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
            Customer / Ship to
          </p>
          <p className="text-gray-700 dark:text-white">
            {dataLoading ? (
              <DataSlotPulse variant="text-md" className="w-36" />
            ) : (
              getCustomerDisplay(order!)
            )}
          </p>
          {!dataLoading && customerEmail !== "—" && (
            <span className="text-gray-600 dark:text-gray-400 block text-xs">
              {customerEmail}
            </span>
          )}
        </div>
        {!dataLoading &&
          order!.orderProductOwners &&
          order!.orderProductOwners.length > 0 && (
            <div className="sm:col-span-2 p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                Product owner(s)
              </p>
              <div className="flex flex-wrap gap-2">
                {order!.orderProductOwners.map((owner) => (
                  <span
                    key={owner.userId}
                    className="inline-flex items-center gap-1 rounded-md bg-white/50 dark:bg-white/10 px-2 py-1 text-xs border border-teal-200/30 dark:border-teal-400/20 text-gray-700 dark:text-white"
                  >
                    {owner.name ?? owner.email}
                    {owner.name && (
                      <span className="text-gray-500 dark:text-gray-400">
                        ({owner.email})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>
    </GlassCard>
  );
}
