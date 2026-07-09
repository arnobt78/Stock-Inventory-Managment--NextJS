"use client";

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
        className="h-11 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-rose-400/30 dark:border-white/20 text-white placeholder:text-white/40 focus-visible:border-rose-400 focus-visible:ring-rose-500/50 shadow-[0_10px_30px_rgba(225,29,72,0.15)]"
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
