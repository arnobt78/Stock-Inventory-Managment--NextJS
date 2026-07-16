"use client";

/**
 * REQ-0128 — shared recent-order right column: price/trailing + status badge + terminal statusAt.
 * REQ-0138 — clearer vertical gap between price, status, and statusAt.
 * REQ-0145 — `align` prop; semantic event icon+color for statusAt.
 */

import type { ReactNode } from "react";
import { OrderStatusBadge } from "@/lib/ui/semantic-badges";
import { statusAtSemanticKind } from "@/lib/ui/semantic-date-styles";
import { SemanticEventDate } from "@/components/shared/SemanticEventDate";
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
  const kind = statusAtSemanticKind(status, paymentStatus);
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
        <SemanticEventDate date={statusAt} kind={kind} mode="datetime" />
      ) : null}
    </div>
  );
}
