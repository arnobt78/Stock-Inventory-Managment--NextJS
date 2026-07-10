"use client";

import { DIALOG_FORM_FIELD_ROSE } from "@/components/shared/dialog-form-field";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MdError } from "react-icons/md";
import { useFormContext } from "react-hook-form";

export default function Quantity() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div className=" flex flex-col gap-2 pt-[6px]">
      <Label htmlFor="quantity" className="text-white/80">
        {`Quantity`}
      </Label>
      <Input
        {...register("quantity", {
          valueAsNumber: true,
          setValueAs: (value: string) => {
            if (value === "" || value === null || value === undefined) {
              return "" as unknown as number;
            }
            const num = Number(value);
            return isNaN(num) ? ("" as unknown as number) : num;
          },
        })}
        type="text"
        id="quantity"
        className={cn("h-11", DIALOG_FORM_FIELD_ROSE)}
        placeholder="10"
      />
      {errors.quantity && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>
            <>{errors.quantity.message}</>
          </p>
        </div>
      )}
    </div>
  );
}
