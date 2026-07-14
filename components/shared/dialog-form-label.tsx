"use client";

/**
 * REQ-0114 — shared dialog field labels (icon + required/optional markers).
 */

import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  DIALOG_FORM_LABEL,
  DIALOG_FORM_REQUIRED_MARK,
} from "@/components/shared/dialog-edge-scroll";
import { cn } from "@/lib/utils";

export type DialogFormLabelProps = {
  htmlFor?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
};

export function DialogFormLabel({
  htmlFor,
  icon: Icon,
  children,
  required,
  optional,
  className,
}: DialogFormLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={cn(DIALOG_FORM_LABEL, "flex items-center gap-2", className)}>
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-white/70" aria-hidden /> : null}
      <span>
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
  );
}
