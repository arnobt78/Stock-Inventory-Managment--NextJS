"use client";

/**
 * REQ-0116 — list-price strikethrough + adjusted line amount when order fees apply.
 * DRY for order line rows, catalog recent orders, and order-create live preview.
 */

import React from "react";
import { cn } from "@/lib/utils";

export type ProportionalPriceDisplayProps = {
  /** Catalog/list line subtotal before tax/shipping/discount. */
  listAmount: number;
  /** Adjusted share of order.total; defaults to listAmount when omitted. */
  adjustedAmount?: number;
  size?: "sm" | "md";
  className?: string;
  /** Hue for the final (adjusted) amount when it differs from list. */
  adjustedTone?: "rose" | "sky";
};

function formatMoney(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

/** True when adjusted amount meaningfully differs from list (fee-adjusted orders). */
export function shouldShowAdjustedPrice(
  listAmount: number,
  adjustedAmount?: number,
): boolean {
  if (adjustedAmount == null || !Number.isFinite(adjustedAmount)) return false;
  return Math.abs(adjustedAmount - listAmount) > 0.005;
}

export function ProportionalPriceDisplay({
  listAmount,
  adjustedAmount,
  size = "md",
  className,
  adjustedTone = "rose",
}: ProportionalPriceDisplayProps) {
  const finalAmount =
    adjustedAmount != null && Number.isFinite(adjustedAmount)
      ? adjustedAmount
      : listAmount;
  const showAdjusted = shouldShowAdjustedPrice(listAmount, finalAmount);

  const sizeClass =
    size === "sm" ? "text-sm" : "text-sm sm:text-lg";

  const adjustedColor =
    adjustedTone === "sky"
      ? "text-sky-600 dark:text-sky-400"
      : "text-rose-600 dark:text-rose-400";

  if (!showAdjusted) {
    return (
      <span
        className={cn(
          "font-normal text-sky-600 dark:text-sky-400",
          sizeClass,
          className,
        )}
      >
        {formatMoney(listAmount)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-normal inline-flex flex-wrap items-baseline gap-x-2",
        sizeClass,
        className,
      )}
    >
      <span className="text-gray-500 dark:text-white/50 line-through text-sm">
        {formatMoney(listAmount)}
      </span>
      <span className={adjustedColor}>{formatMoney(finalAmount)}</span>
    </span>
  );
}
