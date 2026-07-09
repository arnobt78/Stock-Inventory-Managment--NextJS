/**
 * Reusable Dialog Wrapper Component
 * Provides consistent dialog structure, styling, and behavior across the application
 *
 * Features:
 * - Consistent padding, spacing, and responsive design
 * - Standardized header, description, and footer layout
 * - Accessible ARIA attributes
 * - Scrollable content for long forms
 */

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/**
 * Dialog Wrapper Props
 */
export interface DialogWrapperProps extends Omit<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>,
  "children"
> {
  /**
   * Dialog trigger element (button, link, etc.)
   */
  trigger?: React.ReactNode;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description (optional)
   */
  description?: string;

  /**
   * Dialog content (form, list, etc.)
   */
  children: React.ReactNode;

  /**
   * Additional className for DialogContent
   */
  contentClassName?: string;

  /**
   * Additional className for DialogTitle
   */
  titleClassName?: string;

  /**
   * Additional className for DialogDescription
   */
  descriptionClassName?: string;

  /**
   * Custom aria-describedby ID (auto-generated if not provided)
   */
  ariaDescriptionId?: string;
}

/**
 * Dialog Wrapper Component
 *
 * Provides a consistent dialog structure with:
 * - Standardized padding and spacing
 * - Responsive design (mobile-first)
 * - Scrollable content area
 * - Accessible ARIA attributes
 */
export function DialogWrapper({
  trigger,
  title,
  description,
  children,
  contentClassName,
  titleClassName,
  descriptionClassName,
  ariaDescriptionId,
  open,
  onOpenChange,
  ...dialogProps
}: DialogWrapperProps) {
  // Generate unique ID for description if not provided
  const descriptionId = React.useId();
  const finalDescriptionId =
    ariaDescriptionId || `dialog-description-${descriptionId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...dialogProps}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto",
          contentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn("text-[22px]", titleClassName)}>
            {title}
          </DialogTitle>
          {/* Always render DialogDescription to satisfy accessibility, even if empty */}
          <DialogDescription className={descriptionClassName}>
            {description || " "}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
