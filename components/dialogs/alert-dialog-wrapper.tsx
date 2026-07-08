/**
 * Reusable Alert Dialog Wrapper Component
 * Provides consistent alert dialog structure for confirmations and destructive actions
 *
 * Features:
 * - Consistent padding and spacing
 * - Standardized header and footer layout
 * - Accessible ARIA attributes
 * - Support for destructive actions
 */

"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

/**
 * Alert Dialog Wrapper Props
 */
export interface AlertDialogWrapperProps extends Omit<
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>,
  "children"
> {
  /**
   * Alert dialog title
   */
  title: string;

  /**
   * Alert dialog description
   */
  description: string;

  /**
   * Cancel button label (default: "Cancel")
   */
  cancelLabel?: string;

  /**
   * Action button label (e.g., "Delete", "Confirm")
   */
  actionLabel: string;

  /**
   * Action button loading label (e.g., "Deleting...", "Confirming...")
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
   * Action button variant (default: "destructive" for delete actions)
   */
  actionVariant?: "default" | "destructive";

  /**
   * Additional className for content container
   */
  contentClassName?: string;

  /**
   * Additional className for title
   */
  titleClassName?: string;

  /**
   * Additional className for description
   */
  descriptionClassName?: string;

  /**
   * Additional className for footer
   */
  footerClassName?: string;
}

/**
 * Alert Dialog Wrapper Component
 *
 * Provides a consistent alert dialog structure for confirmations:
 * - Standardized padding and spacing
 * - Responsive design
 * - Loading states
 * - Accessible ARIA attributes
 */
export function AlertDialogWrapper({
  title,
  description,
  cancelLabel = "Cancel",
  actionLabel,
  actionLoadingLabel,
  isLoading = false,
  isDisabled = false,
  onCancel,
  onAction,
  actionVariant = "destructive",
  contentClassName,
  titleClassName,
  descriptionClassName,
  footerClassName,
  open,
  onOpenChange,
  ...alertDialogProps
}: AlertDialogWrapperProps) {
  const displayActionLabel = isLoading
    ? actionLoadingLabel || `${actionLabel}...`
    : actionLabel;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} {...alertDialogProps}>
      <AlertDialogContent className={cn("p-4 sm:p-6", contentClassName)}>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn("text-lg sm:text-xl", titleClassName)}
          >
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription
            className={cn("mt-2 text-xs sm:text-sm", descriptionClassName)}
          >
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter
          className={cn(
            "mt-4 sm:mt-8 flex flex-col sm:flex-row gap-2",
            footerClassName,
          )}
        >
          <AlertDialogCancel onClick={onCancel} className="w-full sm:w-auto">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAction}
            disabled={isLoading || isDisabled}
            className={cn(
              "w-full sm:w-auto",
              actionVariant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {displayActionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
