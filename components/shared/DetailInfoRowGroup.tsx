"use client";

/**
 * REQ-0114 — responsive row group for DetailInfoRow siblings on detail pages.
 */

import { cn } from "@/lib/utils";

export type DetailInfoRowGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function DetailInfoRowGroup({
  children,
  className,
}: DetailInfoRowGroupProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-6 gap-y-2 w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
