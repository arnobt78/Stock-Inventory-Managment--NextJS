"use client";

/**
 * REQ-0116 — list-price strikethrough + adjusted line amount when order fees apply.
 * REQ-0149 — final amount text-sm sm:text-base; strike text-xs sm:text-sm (all call sites).
 */

import React from "react";
import { cn } from "@/lib/utils";

export type ProportionalPriceDisplayProps = {
  /** Catalog/list line subtotal before tax/shipping/discount. */
  listAmount: number;
  /** Adjusted share of order.total; defaults to listAmount when omitted. */
  adjustedAmount?: number;
  /**
   * @deprecated REQ-0149 — typography is unified; kept for call-site compat.
   */
  size?: "sm" | "md";
  className?: string;
  /** Hue for the final (adjusted) amount when it differs from list. */
  adjustedTone?: "rose" | "sky";
};

/** Final (non-strike) amount — Order Items, recent orders, create dialog. */
export const PROPORTIONAL_PRICE_FINAL_CLASS = "text-sm sm:text-base";
/** Strikethrough list amount when discount applies. */
export const PROPORTIONAL_PRICE_STRIKE_CLASS = "text-xs sm:text-sm";

function formatMoney(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

/**
 * Dual-price (strike + final) only when list is greater than adjusted (discount).
 * REQ-0146 — never strike a lower list when tax/shipping makes adjusted higher.
 */
export function shouldShowAdjustedPrice(
  listAmount: number,
  adjustedAmount?: number,
): boolean {
  if (adjustedAmount == null || !Number.isFinite(adjustedAmount)) return false;
  return listAmount - adjustedAmount > 0.005;
}

export function ProportionalPriceDisplay({
  listAmount,
  adjustedAmount,
  className,
  adjustedTone = "rose",
}: ProportionalPriceDisplayProps) {
  const finalAmount =
    adjustedAmount != null && Number.isFinite(adjustedAmount)
      ? adjustedAmount
      : listAmount;
  const showStrike = shouldShowAdjustedPrice(listAmount, finalAmount);

  const adjustedColor =
    adjustedTone === "sky"
      ? "text-sky-600 dark:text-sky-400"
      : "text-rose-600 dark:text-rose-400";

  // Upcharge or equal — single amount (prefer adjusted share when present)
  if (!showStrike) {
    return (
      <span
        className={cn(
          "font-normal text-sky-600 dark:text-sky-400",
          PROPORTIONAL_PRICE_FINAL_CLASS,
          className,
        )}
      >
        {formatMoney(finalAmount)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-normal inline-flex flex-wrap items-baseline gap-x-2",
        className,
      )}
    >
      <span
        className={cn(
          "text-gray-500 dark:text-white/80 line-through",
          PROPORTIONAL_PRICE_STRIKE_CLASS,
        )}
      >
        {formatMoney(listAmount)}
      </span>
      <span className={cn(adjustedColor, PROPORTIONAL_PRICE_FINAL_CLASS)}>
        {formatMoney(finalAmount)}
      </span>
    </span>
  );
}
