"use client";

/**
 * REQ-0043 — borderless multi-group filter chip row with per-group dismiss (X) + global Reset.
 * Matches catalog ActiveInactiveFilterChips pattern; rose hover on X, sky hover on Reset.
 */
import type { ReactNode } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FILTER_CHIP_COLLAPSED_CLASS,
  FILTER_CHIP_DISMISS_BTN_CLASS,
  FILTER_CHIP_GROUP_LABEL_CLASS,
  FILTER_CHIP_RESET_BTN_CLASS,
  FILTER_CHIP_ROW_CLASS,
} from "@/lib/ui/filter-chip-styles";

const DEFAULT_MAX_VISIBLE = 2;

export type FilterChipGroup = {
  /** Group label, e.g. "Status", "Category". */
  label: string;
  values: string[];
  onClear: () => void;
  renderBadge: (value: string) => ReactNode;
  /** Collapse to "N Selected" when values exceed this count. */
  maxVisible?: number;
};

export type DismissibleFilterChipsProps = {
  groups: FilterChipGroup[];
  onReset: () => void;
};

export function DismissibleFilterChips({
  groups,
  onReset,
}: DismissibleFilterChipsProps) {
  const activeGroups = groups.filter((g) => g.values.length > 0);
  if (activeGroups.length === 0) return null;

  return (
    <div className={FILTER_CHIP_ROW_CLASS}>
      {activeGroups.map((group) => {
        const maxVisible = group.maxVisible ?? DEFAULT_MAX_VISIBLE;
        const visibleValues = group.values.slice(0, maxVisible);
        const collapsed = group.values.length > maxVisible;

        return (
          <div key={group.label} className="flex flex-wrap items-center gap-2">
            <span className={FILTER_CHIP_GROUP_LABEL_CLASS}>
              {group.label}:
            </span>
            <button
              type="button"
              onClick={group.onClear}
              aria-label={`Clear ${group.label.toLowerCase()} filter`}
              className={FILTER_CHIP_DISMISS_BTN_CLASS}
            >
              <span className="inline-flex flex-wrap items-center gap-1">
                {collapsed ? (
                  <span className={FILTER_CHIP_COLLAPSED_CLASS}>
                    {group.values.length} Selected
                  </span>
                ) : (
                  visibleValues.map((value) => (
                    <span key={value}>{group.renderBadge(value)}</span>
                  ))
                )}
              </span>
              <X
                className="h-3 w-3 shrink-0 text-gray-600 dark:text-white/80"
                aria-hidden
              />
            </button>
          </div>
        );
      })}
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
