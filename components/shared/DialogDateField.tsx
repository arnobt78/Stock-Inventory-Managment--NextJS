"use client";

/**
 * REQ-0117 — date input with single trailing calendar icon (light/dark readable).
 */

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DialogFormLabel } from "@/components/shared/dialog-form-label";
import { cn } from "@/lib/utils";

export type DialogDateFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
  min?: string;
  required?: boolean;
  optional?: boolean;
  /** Omit to use Calendar on label only; pass null for input-side icon only */
  labelIcon?: LucideIcon | null;
  disabled?: boolean;
};

export function DialogDateField({
  id,
  label,
  value,
  onChange,
  inputClassName,
  min,
  required,
  optional,
  labelIcon: LabelIcon = CalendarIcon,
  disabled,
}: DialogDateFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    inputRef.current?.focus();
    inputRef.current?.showPicker?.();
  };

  return (
    <div className="space-y-2">
      <DialogFormLabel
        htmlFor={id}
        icon={LabelIcon ?? undefined}
        required={required}
        optional={optional}
      >
        {label}
      </DialogFormLabel>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          disabled={disabled}
          className={cn(
            "h-11 pr-10 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full",
            inputClassName,
          )}
        />
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded pointer-events-auto"
          aria-label="Open calendar"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
