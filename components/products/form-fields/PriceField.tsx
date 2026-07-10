"use client";

import { DIALOG_FORM_FIELD_ROSE } from "@/components/shared/dialog-form-field";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MdError } from "react-icons/md";
import { NumericFormat } from "react-number-format";
import { useFormContext, Controller } from "react-hook-form";

export default function Price() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-2 pt-[6px]">
      <Label htmlFor="price" className="text-white/80">
        Price
      </Label>
      <Controller
        name="price"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value, ...field } }) => (
          <NumericFormat
            {...field}
            value={value}
            customInput={Input}
            thousandSeparator
            placeholder="100.00"
            className={cn("h-11", DIALOG_FORM_FIELD_ROSE)}
            decimalScale={2}
            allowNegative={false}
            onValueChange={(values) => {
              const { floatValue, value } = values;
              // If the input is empty (value is empty string), pass empty string
              // Otherwise pass the float value
              onChange(
                value === "" ? ("" as unknown as number) : (floatValue ?? 0),
              );
            }}
          />
        )}
      />

      {errors.price && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>{String(errors.price.message)}</p>
        </div>
      )}
    </div>
  );
}
