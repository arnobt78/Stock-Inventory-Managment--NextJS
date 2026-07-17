"use client";

/**
 * Shared "Rows per page" Radix Select for data tables.
 * Uses useDeferredRadixSelect so portals tear down safely on App Router navigation.
 * Changing page size resets pageIndex to 0 so TanStack tables never stay on an out-of-range page.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeferredRadixSelect } from "@/hooks/use-deferred-radix-select";
import { Dispatch, SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PAGE_SIZE_OPTIONS,
  PAGINATION_SELECT_VARIANTS,
  type PaginationSelectVariant,
} from "./pagination-select-styles";

export interface PaginationType {
  pageIndex: number;
  pageSize: number;
}

export type PaginationSelectorLayout = "stacked" | "inline";

export type PaginationSelectorProps = {
  pagination: PaginationType;
  setPagination: Dispatch<SetStateAction<PaginationType>>;
  /** When false, show placeholder only (e.g. tie to table !isLoading) */
  enabled?: boolean;
  variant?: PaginationSelectVariant;
  /** stacked: label above control; inline: table footer row */
  layout?: PaginationSelectorLayout;
  className?: string;
};

export default function PaginationSelector({
  pagination,
  setPagination,
  enabled = true,
  variant = "sky",
  layout = "stacked",
  className,
}: PaginationSelectorProps) {
  const { showSelect, selectRemountKey } = useDeferredRadixSelect({ enabled });
  const styles = PAGINATION_SELECT_VARIANTS[variant];

  const labelClass =
    layout === "inline"
      ? "text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap"
      : "text-gray-700 dark:text-white/80 text-sm";

  const control = !showSelect ? (
    <div className={styles.placeholder} aria-hidden>
      <span>{pagination.pageSize}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </div>
  ) : (
    <Select
      key={selectRemountKey}
      value={pagination.pageSize.toString()}
      onValueChange={(value) => {
        const pageSize = Number(value);
        setPagination((prev) => {
          if (prev.pageSize === pageSize) return prev;
          return {
            pageIndex: 0,
            pageSize,
          };
        });
      }}
    >
      <SelectTrigger className={styles.trigger}>
        <SelectValue placeholder={pagination.pageSize.toString()} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={5}
        className={styles.content}
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <SelectItem
            key={size}
            value={size.toString()}
            className={styles.item}
          >
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (layout === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={labelClass}>Rows per page</div>
        {control}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col sm:flex-row items-center gap-2", className)}
    >
      <div className={labelClass}>Rows per page</div>
      {control}
    </div>
  );
}
