"use client";

import { DialogFormLabel } from "@/components/shared";
import { DIALOG_FORM_FIELD_ROSE } from "@/components/shared/dialog-form-field";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "@/components/shared";
import { MdError } from "react-icons/md";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { Product } from "@/types";

interface SKUProps {
  allProducts: Product[];
}

export default function SKU({ allProducts }: SKUProps) {
  const {
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const [skuError, setSkuError] = useState<string | null>(null);

  const handleSkuChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sku = event.target.value.trim();

    // Check if the SKU already exists
    const isSkuTaken = allProducts.some(
      (product) => product.sku.toLowerCase() === sku.toLowerCase(),
    );

    if (isSkuTaken) {
      setSkuError("SKU is already used. Try a new one.");
      setError("sku", { type: "manual", message: "SKU is already used." });
    } else {
      setSkuError(null);
      clearErrors("sku");
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <DialogFormLabel htmlFor="sku" icon={Hash} required>
          SKU
        </DialogFormLabel>
        <HelpTooltip
          content="Unique code; letters, numbers, hyphens, underscores only."
          side="top"
          ariaLabel="SKU format help"
        />
      </div>
      <Input
        {...register("sku")}
        type="text"
        id="sku"
        className={cn("h-11", DIALOG_FORM_FIELD_ROSE)}
        placeholder="ABC001"
        onChange={handleSkuChange} // Validate SKU on change
      />
      {(skuError || errors.sku?.message) && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>{skuError || String(errors.sku?.message)}</p>
        </div>
      )}
    </div>
  );
}
