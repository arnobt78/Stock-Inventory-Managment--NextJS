"use client";

/**
 * REQ-0187 — Select/Command-safe warehouse densify row (no Links):
 * Line 1: truncated name
 * Line 2: WarehouseTypeBadge · muted "{n} avail."
 */

import { WarehouseTypeBadge } from "@/lib/ui/semantic-badges";
import { cn } from "@/lib/utils";

export type DialogWarehouseOptionRowProps = {
  name: string;
  available: number;
  type?: string | null;
  /** Dark glass Select/Combobox trigger */
  metaOnDark?: boolean;
  className?: string;
};

export function DialogWarehouseOptionRow({
  name,
  available,
  type,
  metaOnDark = false,
  className,
}: DialogWarehouseOptionRowProps) {
  const nameClass = metaOnDark
    ? "text-sm font-normal text-white/90"
    : "text-sm font-normal text-gray-700 dark:text-gray-100";
  const availClass = metaOnDark
    ? "text-xs text-white/70"
    : "text-xs text-gray-600 dark:text-gray-300";

  return (
    <span
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5 text-left", className)}
      title={name}
    >
      <span className={cn("truncate", nameClass)}>{name}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {type ? (
          <WarehouseTypeBadge
            type={type}
            size="compact"
            contrast={metaOnDark ? "solid" : "opaque"}
          />
        ) : null}
        {type ? (
          <span aria-hidden className={availClass}>
            ·
          </span>
        ) : null}
        <span className={cn("shrink-0", availClass)}>
          {available} avail.
        </span>
      </span>
    </span>
  );
}
