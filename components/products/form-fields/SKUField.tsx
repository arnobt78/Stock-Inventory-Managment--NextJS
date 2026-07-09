"use client";

import { Label } from "@/components/ui/label";
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
        <Label htmlFor="sku" className="text-white/80">
          SKU
        </Label>
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
        className="h-11 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-rose-400/30 dark:border-white/20 text-white placeholder:text-white/40 focus-visible:border-rose-400 focus-visible:ring-rose-500/50 shadow-[0_10px_30px_rgba(225,29,72,0.15)]"
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
