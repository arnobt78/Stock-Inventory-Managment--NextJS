"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DIALOG_SELECT_EMPTY_CLASS } from "@/lib/ui/popover-readability-styles";
import {
  selectEmptyMessage,
  type SelectEmptyEntity,
} from "@/lib/ui/select-empty-copy";

type SelectEmptyContentProps = {
  /** Domain entity for default "No … found." copy */
  entity: SelectEmptyEntity;
  /** Override default message when needed */
  children?: ReactNode;
  className?: string;
};

/**
 * REQ-0217 — non-selectable empty body inside Radix SelectContent when the
 * option list is empty (SelectItem cannot render with no options).
 */
export function SelectEmptyContent({
  entity,
  children,
  className,
}: SelectEmptyContentProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(DIALOG_SELECT_EMPTY_CLASS, className)}
    >
      {children ?? selectEmptyMessage(entity)}
    </div>
  );
}
