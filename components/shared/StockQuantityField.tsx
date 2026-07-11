"use client";

/**
 * Stock quantity input with live max hint + inline validation (allocate / transfer dialogs).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type StockQuantityMode = "allocate" | "transfer";

export type StockQuantityFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxAvailable: number;
  mode: StockQuantityMode;
  disabled?: boolean;
  fieldClassName: string;
  /** Global product stock — shown on allocate when product selected */
  productStock?: number;
};

function parseQty(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function getStockQuantityValidation(
  raw: string,
  maxAvailable: number,
  mode: StockQuantityMode,
): { valid: boolean; message: string | null } {
  const qty = parseQty(raw);
  if (qty === null) {
    return { valid: false, message: "Enter a whole number." };
  }
  if (qty < 0) {
    return { valid: false, message: "Quantity cannot be negative." };
  }
  if (mode === "transfer" && qty < 1) {
    return { valid: false, message: "Transfer at least 1 unit." };
  }
  if (mode === "transfer" && qty > maxAvailable) {
    return {
      valid: false,
      message: `Only ${maxAvailable} unit(s) available to transfer.`,
    };
  }
  if (mode === "allocate" && maxAvailable >= 0 && qty > maxAvailable) {
    return {
      valid: false,
      message: `Only ${maxAvailable} unit(s) available in product stock.`,
    };
  }
  return { valid: true, message: null };
}

export function StockQuantityField({
  id,
  value,
  onChange,
  maxAvailable,
  mode,
  disabled,
  fieldClassName,
  productStock,
}: StockQuantityFieldProps) {
  const validation = getStockQuantityValidation(value, maxAvailable, mode);
  const qty = parseQty(value);

  const hint =
    mode === "transfer"
      ? maxAvailable > 0
        ? `${maxAvailable} available to transfer`
        : "Select a product with available stock"
      : productStock !== undefined
        ? `${productStock} in product stock · up to ${maxAvailable} can be added here`
        : null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <Label htmlFor={id} className="text-sm text-white/80">
          Quantity *
        </Label>
        {hint ? (
          <span className="text-xs text-white/60">{hint}</span>
        ) : null}
      </div>
      <Input
        id={id}
        type="number"
        min={mode === "transfer" ? 1 : 0}
        max={maxAvailable > 0 ? maxAvailable : undefined}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={mode === "transfer" ? "1" : "0"}
        aria-invalid={!validation.valid && value.trim() !== ""}
        className={cn(
          "mt-1 h-11 w-full rounded-xl",
          fieldClassName,
          !validation.valid && value.trim() !== ""
            ? "border-rose-400/60 focus-visible:ring-rose-400/40"
            : null,
        )}
      />
      {!validation.valid && value.trim() !== "" ? (
        <p className="mt-1 text-xs text-rose-400 dark:text-rose-300" role="alert">
          {validation.message}
        </p>
      ) : validation.valid && qty !== null && qty >= 0 ? (
        <p className="mt-1 text-xs text-emerald-500/90 dark:text-emerald-400/90">
          {mode === "transfer"
            ? `Transferring ${qty} of ${maxAvailable} available unit(s).`
            : `Allocating ${qty} unit(s) to this warehouse.`}
        </p>
      ) : null}
    </div>
  );
}
