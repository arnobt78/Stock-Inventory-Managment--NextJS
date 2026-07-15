"use client";

/**
 * REQ-0128 — shared recent-order right column: price/trailing + status badge + terminal statusAt.
 */

import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { ClientCompactDateTime } from "@/components/shared/ClientFormatDisplay";
import { OrderStatusBadge } from "@/lib/ui/semantic-badges";
import { TYPO_BODY_MUTED } from "@/lib/ui/typography-scale";
import { cn } from "@/lib/utils";

export type RecentOrderStatusColumnProps = {
  status: string;
  statusAt?: string;
  trailing?: ReactNode;
  className?: string;
};

export function RecentOrderStatusColumn({
  status,
  statusAt,
  trailing,
  className,
}: RecentOrderStatusColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start sm:items-end gap-1 shrink-0 overflow-visible py-1",
        className,
      )}
    >
      {trailing}
      <OrderStatusBadge status={status ?? "pending"} />
      {statusAt ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            TYPO_BODY_MUTED,
          )}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <ClientCompactDateTime date={statusAt} />
        </span>
      ) : null}
    </div>
  );
}
