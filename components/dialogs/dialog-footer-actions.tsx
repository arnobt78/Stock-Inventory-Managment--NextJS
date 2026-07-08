/**
 * Reusable Dialog Footer Actions Component
 * Provides consistent footer button layout and styling for dialogs
 *
 * Features:
 * - Consistent button sizing and spacing
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Loading states support
 * - Cancel and action button variants
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Dialog Footer Actions Props
 */
export interface DialogFooterActionsProps {
  /**
   * Cancel button label (default: "Cancel")
   */
  cancelLabel?: string;

  /**
   * Action button label (e.g., "Save", "Submit", "Delete")
   */
  actionLabel: string;

  /**
   * Action button loading label (e.g., "Saving...", "Submitting...")
   */
  actionLoadingLabel?: string;

  /**
   * Whether the action is in progress (shows loading state)
   */
  isLoading?: boolean;

  /**
   * Whether the action button is disabled
   */
  isDisabled?: boolean;

  /**
   * Cancel button click handler
   */
  onCancel?: () => void;

  /**
   * Action button click handler
   */
  onAction: () => void;

  /**
   * Cancel button variant (default: "secondary")
   */
  cancelVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /**
   * Action button variant (default: "default")
   */
  actionVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /**
   * Additional className for footer container
   */
  footerClassName?: string;

  /**
   * Additional className for cancel button
   */
  cancelClassName?: string;

  /**
   * Additional className for action button
   */
  actionClassName?: string;

  /**
   * Whether to show cancel button (default: true)
   */
  showCancel?: boolean;

  /**
   * Custom footer content (overrides default buttons if provided)
   */
  children?: React.ReactNode;
}

/**
 * Dialog Footer Actions Component
 *
 * Provides consistent footer button layout:
 * - Cancel button (left/secondary)
 * - Action button (right/primary)
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Loading states
 */
export function DialogFooterActions({
  cancelLabel = "Cancel",
  actionLabel,
  actionLoadingLabel,
  isLoading = false,
  isDisabled = false,
  onCancel,
  onAction,
  cancelVariant = "secondary",
  actionVariant = "default",
  footerClassName,
  cancelClassName,
  actionClassName,
  showCancel = true,
  children,
}: DialogFooterActionsProps) {
  // If custom children provided, use them instead
  if (children) {
    return (
      <DialogFooter
        className={cn(
          "mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2",
          footerClassName,
        )}
      >
        {children}
      </DialogFooter>
    );
  }

  const displayActionLabel = isLoading
    ? actionLoadingLabel || `${actionLabel}...`
    : actionLabel;

  return (
    <DialogFooter
      className={cn(
        "mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2",
        footerClassName,
      )}
    >
      {showCancel && (
        <DialogClose asChild>
          <Button
            variant={cancelVariant}
            className={cn("h-11 w-full sm:w-auto px-11", cancelClassName)}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </Button>
        </DialogClose>
      )}
      <Button
        variant={actionVariant}
        className={cn("h-11 w-full sm:w-auto px-11", actionClassName)}
        onClick={onAction}
        disabled={isLoading || isDisabled}
        type="button"
      >
        {displayActionLabel}
      </Button>
    </DialogFooter>
  );
}
