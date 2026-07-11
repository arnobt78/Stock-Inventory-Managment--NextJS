"use client";

/**
 * REQ-0068 — warehouse picker for a single order line when the product has allocations.
 * Loads options via TanStack useStockByProduct (cached per productId).
 */

import React, { useMemo } from "react";
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
  /** Max qty for validation hint */
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
  const { data: allocations, isLoading } = useStockByProduct(productId);

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

  if (!productId || isLoading) return null;
  if (options.length === 0) return null;

  const selected = options.find((o) => o.warehouseId === value);
  const qty = quantity ?? 0;
  const overCap =
    selected != null && qty > 0 && qty > selected.available;

  return (
    <div className="space-y-1.5 mt-2">
      <Label className="text-xs text-muted-foreground">Fulfill from warehouse</Label>
      <DeferredSelectGate enabled={dialogOpen}>
        {({ selectRemountKey }) => (
          <Select
            key={selectRemountKey}
            value={value ?? ""}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(DIALOG_FORM_FIELD_VIOLET, "h-9 text-sm")}
            >
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
          Max {selected.available} at {selected.name}
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
