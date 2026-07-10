/**
 * Product Expiration Date Field Component
 * Uses native date input with calendar icon
 */

"use client";

import { useRef } from "react";
import { DIALOG_FORM_FIELD_ROSE } from "@/components/shared/dialog-form-field";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MdError } from "react-icons/md";
import { Calendar as CalendarIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

export default function ExpirationDateField() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Watch expirationDate to format it for input
  const expirationDate = watch("expirationDate");

  // Format date for input (YYYY-MM-DD)
  const formattedDate =
    expirationDate && expirationDate !== ""
      ? new Date(expirationDate).toISOString().split("T")[0]
      : "";

  // Handle calendar icon click - focus the input to open native date picker
  const handleCalendarIconClick = () => {
    inputRef.current?.focus();
    inputRef.current?.showPicker?.();
  };

  return (
    <div className="mt-5 flex flex-col gap-2">
      <Label htmlFor="expiration-date" className="text-white/80">
        Expiration Date (Optional)
      </Label>
      <div className="relative">
        <Input
          {...register("expirationDate")}
          ref={(e) => {
            register("expirationDate").ref(e);
            inputRef.current = e;
          }}
          type="date"
          id="expiration-date"
          value={formattedDate}
          className={cn(
            "h-11 pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full",
            DIALOG_FORM_FIELD_ROSE,
          )}
        />
        <button
          type="button"
          onClick={handleCalendarIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white dark:text-white/40 hover:text-white dark:hover:text-white/60 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400/50 rounded pointer-events-auto"
          aria-label="Open calendar"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>
      {errors.expirationDate && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>{String(errors.expirationDate.message)}</p>
        </div>
      )}
    </div>
  );
}
