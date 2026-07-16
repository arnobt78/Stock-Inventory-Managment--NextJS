/**
 * REQ-0138 — colored, capitalized catalog allocation summary for product detail warehouse header.
 */
"use client";

import { cn } from "@/lib/utils";

export type CatalogAllocationSummaryTextProps = {
  catalogQty: number;
  allocatedTotal: number;
  unallocated: number;
  reservedCommitment?: number;
  className?: string;
};

/** Segment: Label + colored number (Catalog / Allocated / Unallocated / Reserved). */
export function CatalogAllocationSummaryText({
  catalogQty,
  allocatedTotal,
  unallocated,
  reservedCommitment = 0,
  className,
}: CatalogAllocationSummaryTextProps) {
  return (
    <span
      className={cn(
        // Muted labels so sky/emerald/amber numbers match Warehouse Stock header
        "inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-normal text-gray-600 dark:text-white/60",
        className,
      )}
    >
      <span>
        Catalog{" "}
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {catalogQty}
        </span>
      </span>
      <span className="text-gray-400 dark:text-white/40" aria-hidden>
        ·
      </span>
      <span>
        Allocated{" "}
        <span className="text-sky-600 dark:text-sky-400 font-medium">
          {allocatedTotal}
        </span>
      </span>
      <span className="text-gray-400 dark:text-white/40" aria-hidden>
        ·
      </span>
      <span>
        Unallocated{" "}
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {unallocated}
        </span>
      </span>
      {reservedCommitment > 0 ? (
        <>
          <span className="text-gray-400 dark:text-white/40" aria-hidden>
            ·
          </span>
          <span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {reservedCommitment}
            </span>{" "}
            Reserved
          </span>
        </>
      ) : null}
    </span>
  );
}
