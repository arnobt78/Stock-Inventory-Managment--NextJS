"use client";

/**
 * REQ-0068/0111/0113 — warehouse picker in order line grid (presentation-only).
 * Parent hook owns fetch + validation; receives allocationRows from useOrderLineStockValidation.
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
import { DeferredSelectGate, DialogFormLabel } from "@/components/shared";
import {
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_FEEDBACK_ROW,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  AUTO_WAREHOUSE_VALUE,
  buildOrderLineWarehousePickOptions,
  type OrderLineAllocationRow,
} from "@/lib/orders/order-line-stock-validation";

export type OrderLineWarehouseSelectProps = {
  productId: string;
  value?: string;
  onChange: (warehouseId: string | undefined) => void;
  dialogOpen: boolean;
  disabled?: boolean;
  /** Catalog committed available when auto-assign (from parent validator). */
  catalogAvailable?: number;
  /** True when product has warehouse allocation rows. */
  hasAllocations?: boolean;
  /** REQ-0111 — manual-pick cap error from parent validator. */
  manualPickError?: string | null;
  /** REQ-0113 — required; parent injects from useOrderLineStockValidation. */
  allocationRows: OrderLineAllocationRow[];
  allocationsLoading: boolean;
};

export function OrderLineWarehouseSelect({
  productId,
  value,
  onChange,
  dialogOpen,
  disabled,
  manualPickError = null,
  allocationRows,
  allocationsLoading,
}: OrderLineWarehouseSelectProps) {
  const options = useMemo(
    () => buildOrderLineWarehousePickOptions(allocationRows, value),
    [allocationRows, value],
  );

  const isManualPick =
    value != null &&
    value !== AUTO_WAREHOUSE_VALUE &&
    String(value).trim() !== "";

  const selectValue =
    isManualPick && value ? value : AUTO_WAREHOUSE_VALUE;

  const handleValueChange = (next: string) => {
    if (next === AUTO_WAREHOUSE_VALUE) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  if (!productId) {
    return (
      <div className="flex flex-col gap-2">
        <DialogFormLabel icon={Warehouse} optional>
          Warehouse
        </DialogFormLabel>
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

  if (allocationsLoading) {
    return (
      <div className="flex flex-col gap-2">
        <DialogFormLabel icon={Warehouse} optional>
          Warehouse
        </DialogFormLabel>
        <div className={cn(DIALOG_FORM_FIELD_VIOLET, "h-11 animate-pulse")} />
      </div>
    );
  }

  if (!allocationRows.length) {
    return (
      <div className="flex flex-col gap-2">
        <DialogFormLabel icon={Warehouse} optional>
          Warehouse
        </DialogFormLabel>
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
      <DialogFormLabel icon={Warehouse} optional>
        Warehouse
      </DialogFormLabel>
      <DeferredSelectGate enabled={dialogOpen}>
        {({ selectRemountKey }) => (
          <Select
            key={selectRemountKey}
            value={selectValue}
            onValueChange={handleValueChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(DIALOG_FORM_FIELD_VIOLET, "h-11 text-sm gap-2")}
            >
              <SelectValue placeholder="Auto-assign warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUTO_WAREHOUSE_VALUE}>
                Auto-assign warehouses
              </SelectItem>
              {options.map((o) => (
                <SelectItem
                  key={o.warehouseId}
                  value={o.warehouseId}
                  className="flex justify-between gap-4"
                >
                  <span className="truncate">{o.name}</span>
                  <span className="shrink-0 text-white/60">
                    ({o.available} available)
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DeferredSelectGate>
      {manualPickError ? (
        <div className={DIALOG_FORM_FEEDBACK_ROW}>
          <p className={DIALOG_FORM_ERROR_TEXT} role="alert">
            {manualPickError}
          </p>
        </div>
      ) : null}
    </div>
  );
}
