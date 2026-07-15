/**
 * Product Expiration Date Field Component
 * REQ-0117 — DialogFormLabel + single trailing calendar icon
 */

"use client";

import { useRef } from "react";
import { DIALOG_FORM_FIELD_ROSE, DIALOG_DATE_CALENDAR_ICON_CLASS } from "@/components/shared/dialog-form-field";
import { DialogFormLabel } from "@/components/shared/dialog-form-label";
import { cn } from "@/lib/utils";
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

  const expirationDate = watch("expirationDate");

  const formattedDate =
    expirationDate && expirationDate !== ""
      ? new Date(expirationDate).toISOString().split("T")[0]
      : "";

  const handleCalendarIconClick = () => {
    inputRef.current?.focus();
    inputRef.current?.showPicker?.();
  };

  return (
    <div className="mt-5 flex flex-col gap-2">
      <DialogFormLabel htmlFor="expiration-date" icon={CalendarIcon} optional>
        Expiration Date
      </DialogFormLabel>
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
            "h-11 pr-10 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full",
            DIALOG_FORM_FIELD_ROSE,
          )}
        />
        <button
          type="button"
          onClick={handleCalendarIconClick}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded pointer-events-auto",
            DIALOG_DATE_CALENDAR_ICON_CLASS,
          )}
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
