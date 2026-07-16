"use client";

/**
 * REQ-0128 — shared recent-order right column: price/trailing + status badge + terminal statusAt.
 * REQ-0138 — clearer vertical gap between price, status, and statusAt.
 * REQ-0145 — `align` prop so order table can force start on all breakpoints (sm:items-end otherwise wins).
 */

import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { ClientCompactDateTime } from "@/components/shared/ClientFormatDisplay";
import { OrderStatusBadge } from "@/lib/ui/semantic-badges";
import {
  statusAtSemanticKind,
  semanticDateClass,
} from "@/lib/ui/semantic-date-styles";
import { cn } from "@/lib/utils";

export type RecentOrderStatusColumnProps = {
  status: string;
  statusAt?: string;
  paymentStatus?: string;
  trailing?: ReactNode;
  className?: string;
  /** Portal/catalog cards default end on sm+; order table uses start (REQ-0145) */
  align?: "start" | "end";
};

export function RecentOrderStatusColumn({
  status,
  statusAt,
  paymentStatus,
  trailing,
  className,
  align = "end",
}: RecentOrderStatusColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 shrink-0 overflow-visible py-1",
        align === "start"
          ? "items-start sm:items-start"
          : "items-start sm:items-end",
        className,
      )}
    >
      {trailing}
      <OrderStatusBadge status={status ?? "pending"} size="compact" />
      {statusAt ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            semanticDateClass(statusAtSemanticKind(status, paymentStatus)),
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          <ClientCompactDateTime
            date={statusAt}
            semantic={statusAtSemanticKind(status, paymentStatus)}
            className="text-xs"
          />
        </span>
      ) : null}
    </div>
  );
}
