"use client";

/**
 * REQ-0045 — cmdk filter row with whole-row toggle (checkbox is visual only).
 * Use onSelect on CommandItem; never wire Checkbox onCheckedChange (prevents hang / double-toggle).
 */

import * as React from "react";
import { CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type FilterCommandCheckboxItemProps = {
  /** cmdk search/filter text (usually human label) */
  value: string;
  /** Value passed to onToggle */
  toggleValue: string;
  checked: boolean;
  onToggle: (value: string) => void;
  className?: string;
  checkboxClassName?: string;
  children: React.ReactNode;
};

export function FilterCommandCheckboxItem({
  value,
  toggleValue,
  checked,
  onToggle,
  className,
  checkboxClassName,
  children,
}: FilterCommandCheckboxItemProps) {
  return (
    <CommandItem
      value={value}
      onSelect={() => onToggle(toggleValue)}
      className={cn(
        "mb-2 flex w-full cursor-pointer items-center text-gray-700 dark:text-white/80 focus:bg-rose-100 focus:text-gray-700 dark:focus:bg-white/10 dark:focus:text-white",
        className,
      )}
    >
      <Checkbox
        checked={checked}
        tabIndex={-1}
        aria-hidden
        className={cn(
          "pointer-events-none mr-2 size-4 shrink-0 rounded-[4px] border-white/20 bg-white/5 backdrop-blur-md focus:ring-2 focus:ring-rose-500/50",
          checkboxClassName,
        )}
      />
      <span className="pointer-events-none flex min-w-0 flex-1 items-center">
        {children}
      </span>
    </CommandItem>
  );
}
