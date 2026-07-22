"use client";

/**
 * REQ-0068/0111/0113/0126 — warehouse picker in order line grid (presentation-only).
 * Parent hook owns fetch + validation; receives allocationRows from useOrderLineStockValidation.
 *
 * REQ-0187 gap — column-scoped feedback under this control only (Max / stockError / Auto-assign hint).
 * REQ-0187 densify — DialogWarehouseOptionRow (name; type badge · muted avail) in trigger + items.
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
import {
  DeferredSelectGate,
  DialogFormLabel,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_HINT_TEXT,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
} from "@/components/shared";
import { DialogWarehouseOptionRow } from "@/components/warehouses/DialogWarehouseOptionRow";
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
  /** REQ-0111 — manual-pick cap error from parent validator. */
  manualPickError?: string | null;
  /** REQ-0187 — catalog/auto-assign stock error (non-manual); supersedes hint. */
  catalogStockError?: string | null;
  /** REQ-0187 — Auto-assign hint under Warehouse when no error. */
  hintText?: string | null;
  /** REQ-0113 — required; parent injects from useOrderLineStockValidation. */
  allocationRows: OrderLineAllocationRow[];
  allocationsLoading: boolean;
};

/** Priority: Max → catalog stockError → Auto-assign hint (REQ-0187). */
function WarehouseColumnFeedback({
  manualPickError,
  catalogStockError,
  hintText,
}: {
  manualPickError?: string | null;
  catalogStockError?: string | null;
  hintText?: string | null;
}) {
  if (manualPickError) {
    return (
      <p className={DIALOG_FORM_ERROR_TEXT} role="alert">
        {manualPickError}
      </p>
    );
  }
  if (catalogStockError) {
    return (
      <p
        className={cn(DIALOG_FORM_ERROR_TEXT, "flex items-center gap-1")}
        role="alert"
      >
        <span>⚠️</span>
        <span>{catalogStockError}</span>
      </p>
    );
  }
  if (hintText) {
    return <p className={DIALOG_FORM_HINT_TEXT}>{hintText}</p>;
  }
  return null;
}

export function OrderLineWarehouseSelect({
  productId,
  value,
  onChange,
  dialogOpen,
  disabled,
  manualPickError = null,
  catalogStockError = null,
  hintText = null,
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

  const selectedOption = useMemo(
    () => options.find((o) => o.warehouseId === value),
    [options, value],
  );

  const handleValueChange = (next: string) => {
    if (next === AUTO_WAREHOUSE_VALUE) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  const feedback = (
    <WarehouseColumnFeedback
      manualPickError={manualPickError}
      catalogStockError={catalogStockError}
      hintText={hintText}
    />
  );

  if (!productId) {
    return (
      <div className="flex flex-col gap-2">
        <DialogFormLabel icon={Warehouse} optional>
          Warehouse
        </DialogFormLabel>
        <div
          className={cn(
            DIALOG_FORM_FIELD_VIOLET,
            "h-11 rounded-md flex items-center px-3 text-sm text-white/50",
          )}
        >
          Select product first
        </div>
        {feedback}
      </div>
    );
  }

  if (allocationsLoading) {
    return (
      <div className="flex flex-col gap-2">
        <DialogFormLabel icon={Warehouse} optional>
          Warehouse
        </DialogFormLabel>
        <div
          className={cn(DIALOG_FORM_FIELD_VIOLET, "h-11 rounded-md animate-pulse")}
        />
        {feedback}
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
            "h-11 rounded-md flex items-center px-3 text-sm text-white/50",
          )}
        >
          Not warehouse-tracked
        </div>
        {feedback}
      </div>
    );
  }

  const triggerPlaceholder = isManualPick && selectedOption ? (
    <DialogWarehouseOptionRow
      name={selectedOption.name}
      available={selectedOption.available}
      type={selectedOption.type}
      metaOnDark
      className="flex-1"
    />
  ) : (
    <span className="text-sm text-white/80">Auto-assign warehouses</span>
  );

  return (
    <div className="flex flex-col gap-2">
      <DialogFormLabel icon={Warehouse} optional>
        Warehouse
      </DialogFormLabel>
      <DeferredSelectGate
        enabled={dialogOpen}
        placeholder={
          <div
            className={cn(
              DIALOG_FORM_FIELD_VIOLET,
              "flex min-h-11 w-full items-center rounded-md px-3 py-2 text-sm",
            )}
            aria-hidden
          >
            {triggerPlaceholder}
          </div>
        }
      >
        {({ selectRemountKey }) => (
          <Select
            key={selectRemountKey}
            value={selectValue}
            onValueChange={handleValueChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                DIALOG_FORM_FIELD_VIOLET,
                "h-auto min-h-11 gap-2 py-2 text-sm",
              )}
            >
              <SelectValue placeholder="Auto-assign warehouses">
                {isManualPick && selectedOption ? (
                  <DialogWarehouseOptionRow
                    name={selectedOption.name}
                    available={selectedOption.available}
                    type={selectedOption.type}
                    metaOnDark
                    className="flex-1"
                  />
                ) : (
                  "Auto-assign warehouses"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              className={cn(DIALOG_SELECT_CONTENT_CLASS)}
              position="popper"
              sideOffset={5}
              align="start"
            >
              <SelectItem
                value={AUTO_WAREHOUSE_VALUE}
                className={DIALOG_SELECT_ITEM_CLASS}
              >
                Auto-assign warehouses
              </SelectItem>
              {options.map((o) => (
                <SelectItem
                  key={o.warehouseId}
                  value={o.warehouseId}
                  className={cn("py-2", DIALOG_SELECT_ITEM_CLASS)}
                >
                  <DialogWarehouseOptionRow
                    name={o.name}
                    available={o.available}
                    type={o.type}
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DeferredSelectGate>
      {feedback}
    </div>
  );
}
