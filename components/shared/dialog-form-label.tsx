"use client";

/**
 * REQ-0114/0117 — shared dialog field labels (icon + label on one row).
 * Use wrapperClassName for mb-* spacing; never pass `block` on className (kills flex).
 */

import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  DIALOG_FORM_LABEL,
  DIALOG_FORM_LABEL_ROW,
  DIALOG_FORM_REQUIRED_MARK,
} from "@/components/shared/dialog-edge-scroll";
import { cn } from "@/lib/utils";

export type DialogFormLabelProps = {
  htmlFor?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  /** Applied to outer wrapper (spacing); Label row stays inline-flex */
  wrapperClassName?: string;
  className?: string;
};

export function DialogFormLabel({
  htmlFor,
  icon: Icon,
  children,
  required,
  optional,
  wrapperClassName,
  className,
}: DialogFormLabelProps) {
  return (
    <div className={wrapperClassName}>
      <Label
        htmlFor={htmlFor}
        className={cn(DIALOG_FORM_LABEL, DIALOG_FORM_LABEL_ROW, className)}
      >
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
        ) : null}
        <span className="min-w-0">
          {children}
          {required ? (
            <span className={DIALOG_FORM_REQUIRED_MARK} aria-hidden>
              {" "}
              *
            </span>
          ) : null}
          {optional ? (
            <span className="text-xs font-normal text-white/50"> (optional)</span>
          ) : null}
        </span>
      </Label>
    </div>
  );
}
