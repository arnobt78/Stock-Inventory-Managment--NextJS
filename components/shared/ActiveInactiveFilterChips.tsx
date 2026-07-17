"use client";

/**
 * REQ-0041 — borderless active/inactive filter chip row with dismissible badge + reset.
 */
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveInactiveBadge } from "@/lib/ui/semantic-badges";
import type { CatalogStatusFilter } from "@/lib/ui/catalog-filter-tokens";
import {
  FILTER_CHIP_DISMISS_BTN_CLASS,
  FILTER_CHIP_GROUP_LABEL_CLASS,
  FILTER_CHIP_RESET_BTN_CLASS,
  FILTER_CHIP_ROW_CLASS,
} from "@/lib/ui/filter-chip-styles";

export type ActiveInactiveFilterChipsProps = {
  statusFilter: CatalogStatusFilter;
  onClear: () => void;
  onReset: () => void;
};

export function ActiveInactiveFilterChips({
  statusFilter,
  onClear,
  onReset,
}: ActiveInactiveFilterChipsProps) {
  if (statusFilter === "all") return null;

  const isActive = statusFilter === "active";

  return (
    <div className={FILTER_CHIP_ROW_CLASS}>
      <span className={FILTER_CHIP_GROUP_LABEL_CLASS}>Status:</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${isActive ? "active" : "inactive"} status filter`}
        className={FILTER_CHIP_DISMISS_BTN_CLASS}
      >
        <ActiveInactiveBadge active={isActive} size="compact" />
        <X
          className="h-3 w-3 shrink-0 text-gray-600 dark:text-white/80"
          aria-hidden
        />
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className={FILTER_CHIP_RESET_BTN_CLASS}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reset
      </Button>
    </div>
  );
}
