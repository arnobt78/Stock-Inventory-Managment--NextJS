/**
 * REQ-0079 — numbered circle for ordered card lists (recent orders, etc.).
 * Light: gray-600 bg + white text; dark: inverted for contrast.
 */
import React from "react";
import { cn } from "@/lib/utils";

export type ListIndexBadgeProps = {
  index: number;
  className?: string;
};

export function ListIndexBadge({ index, className }: ListIndexBadgeProps) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-500/30 text-xs font-medium",
        "bg-gray-600 text-white dark:border-gray-400/40 dark:bg-gray-200 dark:text-gray-700",
        className,
      )}
      aria-hidden
    >
      {index}
    </span>
  );
}
