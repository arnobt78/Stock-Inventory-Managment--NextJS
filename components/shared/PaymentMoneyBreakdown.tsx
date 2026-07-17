"use client";

/**
 * REQ-0152 — Paid / remaining / due money lines with semantic colors.
 * Used in Invoice Total column and compact Order Total when mid-pay.
 */

import { CircleDollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMoneyBreakdownProps = {
  total: number;
  amountPaid?: number | null;
  amountDue?: number | null;
  /** table = compact stacked; detail = slightly larger */
  variant?: "table" | "detail";
  className?: string;
};

export function PaymentMoneyBreakdown({
  total,
  amountPaid = 0,
  amountDue,
  variant = "table",
  className,
}: PaymentMoneyBreakdownProps) {
  const paid = Math.max(0, Number(amountPaid) || 0);
  const due =
    amountDue != null
      ? Math.max(0, Number(amountDue) || 0)
      : Math.max(0, total - paid);
  const showBreakdown = paid > 0 || due > 0;
  const textSize =
    variant === "detail" ? "text-sm" : "text-xs sm:text-sm";

  return (
    <div className={cn("flex flex-col gap-0.5 min-w-0", className)}>
      <span
        className={cn(
          "font-medium text-gray-900 dark:text-gray-100 tabular-nums",
          variant === "detail" ? "text-sm sm:text-base" : "text-sm",
        )}
      >
        ${total.toFixed(2)}
      </span>
      {showBreakdown && (
        <>
          {paid > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 tabular-nums",
                textSize,
              )}
            >
              <CircleDollarSign className="h-3 w-3 shrink-0" aria-hidden />
              Paid ${paid.toFixed(2)}
            </span>
          )}
          {due > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 tabular-nums",
                textSize,
              )}
            >
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              Due ${due.toFixed(2)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
