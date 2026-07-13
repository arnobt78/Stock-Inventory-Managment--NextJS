"use client";

/**
 * REQ-0068/0074 — warehouse picker aligned in order line grid (h-11, Warehouse icon).
 */

import React, { useMemo } from "react";
import { Warehouse } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DeferredSelectGate } from "@/components/shared";
import { useStockByProduct } from "@/hooks/queries";
import { DIALOG_FORM_FIELD_VIOLET } from "@/components/shared";
import { cn } from "@/lib/utils";

export type OrderLineWarehouseSelectProps = {
  productId: string;
  value?: string;
  onChange: (warehouseId: string) => void;
  quantity?: number;
  dialogOpen: boolean;
  disabled?: boolean;
};

export function OrderLineWarehouseSelect({
  productId,
  value,
  onChange,
  quantity,
  dialogOpen,
  disabled,
}: OrderLineWarehouseSelectProps) {
  const { data: allocations, isLoading } = useStockByProduct(
    productId,
    undefined,
    { enabled: dialogOpen && !!productId },
  );

  const options = useMemo(() => {
    if (!allocations?.length) return [];
    return allocations
      .map((a) => {
        const available =
          Number(a.quantity) - Number(a.reservedQuantity ?? 0);
        return {
          warehouseId: a.warehouseId,
          name: a.warehouse?.name ?? "Warehouse",
          available,
        };
      })
      .filter((o) => o.available > 0)
      .sort((a, b) => b.available - a.available);
  }, [allocations]);

  const hasOptions = options.length > 0;
  const selected = options.find((o) => o.warehouseId === value);
  const qty = quantity ?? 0;
  const overCap =
    selected != null && qty > 0 && qty > selected.available;

  if (!productId) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2 text-white/80 text-sm">
          <Warehouse className="h-4 w-4 shrink-0 text-violet-400" />
          Warehouse
        </Label>
        <div
          className={cn(
            DIALOG_FORM_FIELD_VIOLET,
            "h-11 flex items-center px-3 text-sm text-white/50",
          )}
        >
          Select product first
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2 text-white/80 text-sm">
          <Warehouse className="h-4 w-4 shrink-0 text-violet-400" />
          Warehouse
        </Label>
        <div className={cn(DIALOG_FORM_FIELD_VIOLET, "h-11 animate-pulse")} />
      </div>
    );
  }

  if (!hasOptions) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2 text-white/80 text-sm">
          <Warehouse className="h-4 w-4 shrink-0 text-violet-400" />
          Warehouse
        </Label>
        <div
          className={cn(
            DIALOG_FORM_FIELD_VIOLET,
            "h-11 flex items-center px-3 text-sm text-white/50",
          )}
        >
          Not warehouse-tracked
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-2 text-white/80 text-sm">
        <Warehouse className="h-4 w-4 shrink-0 text-violet-400" />
        Warehouse
      </Label>
      <DeferredSelectGate enabled={dialogOpen}>
        {({ selectRemountKey }) => (
          <Select
            key={selectRemountKey}
            value={value ?? ""}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(DIALOG_FORM_FIELD_VIOLET, "h-11 text-sm gap-2")}
            >
              <Warehouse className="h-4 w-4 shrink-0 text-violet-400" />
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.warehouseId} value={o.warehouseId}>
                  {o.name} ({o.available} available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DeferredSelectGate>
      {overCap && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Max {selected!.available} at {selected!.name}
        </p>
      )}
      {!value && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Warehouse required for this product
        </p>
      )}
    </div>
  );
}
