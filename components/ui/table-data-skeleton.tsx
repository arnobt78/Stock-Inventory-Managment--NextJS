/**
 * Table body pulse rows — real column headers stay visible (REQ-0021).
 * Use inside TableBody while data is loading; only cell values pulse.
 */

import React from "react";
import { TableBody, TableCell, TableRow } from "./table";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

export type TableBodyPulseRowsProps = {
  rows?: number;
  columnCount: number;
  /** Alternating row tint to match loaded tables */
  striped?: boolean;
  className?: string;
};

export function TableBodyPulseRows({
  rows = 8,
  columnCount,
  striped = true,
  className,
}: TableBodyPulseRowsProps) {
  return (
    <TableBody className={className}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow
          key={rowIndex}
          className={
            striped
              ? rowIndex % 2 === 0
                ? "bg-white/30 dark:bg-white/5"
                : "bg-white/20 dark:bg-white/10"
              : undefined
          }
        >
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell key={colIndex} className="p-4">
              <Skeleton className="h-4 w-full min-w-[60px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export type TableFrameProps = {
  children: React.ReactNode;
  className?: string;
};

/** Shared glass table frame used by list tables. */
export function TableFrame({ children, className }: TableFrameProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-violet-400/20 dark:border-white/10 shadow-[0_30px_80px_rgba(139,92,246,0.25)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.15)] bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
