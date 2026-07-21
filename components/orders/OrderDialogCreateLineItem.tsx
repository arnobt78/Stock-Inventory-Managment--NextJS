"use client";

/**
 * REQ-0111 — single create-order line row with reactive stock validation hook.
 */

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { UseFormSetValue, FieldErrors } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Layers, X } from "lucide-react";
import { ProductOptionRow } from "@/components/products/ProductOptionRow";
import { OrderLineWarehouseSelect } from "@/components/orders/OrderLineWarehouseSelect";
import {
  DeferredSelectGate,
  DialogFormLabel,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_HINT_TEXT,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  ProportionalPriceDisplay,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  prefetchStockByProduct,
  useOrderLineStockValidation,
} from "@/hooks/queries";
import type { OrderLineStockProduct } from "@/lib/orders/order-line-stock-validation";
import { formatOrderLineAutoAssignHint } from "@/lib/orders/order-line-stock-validation";

/** Create-order form shape shared with OrderDialog (REQ-0111/0113). */
export type OrderFormData = {
  items: Array<{
    productId: string;
    quantity?: number | undefined;
    warehouseId?: string;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  useSameAddress?: boolean;
  tax?: number;
  shipping?: number;
  discount?: number;
  notes?: string;
};

/** Minimal product shape for create-order line UI + stock hook (REQ-0111). */
export type OrderDialogLineProduct = OrderLineStockProduct & {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number | string;
};

export type OrderDialogCreateLineItemProps = {
  lineId: string;
  index: number;
  productId: string;
  quantityValue: number | undefined;
  warehouseId: string | undefined;
  availableProducts: OrderDialogLineProduct[];
  productSelectPlaceholder: string;
  isClientCreatingOrder: boolean;
  productOwner?: { name: string } | null;
  dialogOpen: boolean;
  canRemove: boolean;
  createSetValue: UseFormSetValue<OrderFormData>;
  createErrors: FieldErrors<OrderFormData>;
  onRemove: () => void;
  onStockValidityChange: (lineId: string, hasStockError: boolean) => void;
};

export function OrderDialogCreateLineItem({
  lineId,
  index,
  productId,
  quantityValue,
  warehouseId,
  availableProducts,
  productSelectPlaceholder,
  isClientCreatingOrder,
  productOwner,
  dialogOpen,
  canRemove,
  createSetValue,
  createErrors,
  onRemove,
  onStockValidityChange,
}: OrderDialogCreateLineItemProps) {
  const queryClient = useQueryClient();

  const quantity =
    quantityValue !== undefined && quantityValue !== null
      ? Number(quantityValue)
      : 0;

  const selectedProduct = availableProducts.find((p) => p.id === productId);

  const { validation, hasAllocations, allocationRows, allocationsLoading } =
    useOrderLineStockValidation({
      productId,
      product: selectedProduct,
      warehouseId,
      quantity,
      enabled: dialogOpen && !!productId,
    });

  const stockError =
    validation && quantity > 0 && !validation.ok && validation.mode !== "manual"
      ? validation.message
      : null;

  const manualPickError =
    validation?.mode === "manual" && !validation.ok ? validation.message : null;

  const isManualPick = warehouseId != null && String(warehouseId).trim() !== "";

  const showAutoAssignHint =
    selectedProduct &&
    hasAllocations &&
    !isManualPick &&
    validation?.maxQty != null;

  useEffect(() => {
    onStockValidityChange(lineId, Boolean(stockError));
  }, [lineId, onStockValidityChange, stockError]);

  const itemSubtotal =
    selectedProduct && quantity > 0
      ? Number(selectedProduct.price) * quantity
      : 0;

  return (
    <div className="p-4 border border-violet-400/20 rounded-lg bg-white/5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)] gap-2 items-start">
          <div className="flex flex-col gap-2">
            <DialogFormLabel icon={Package} required>
              Product {index + 1}
            </DialogFormLabel>
            <DeferredSelectGate
              enabled={dialogOpen}
              placeholder={
                // REQ-0198 — match SelectTrigger (product thumb row)
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-sm",
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                  aria-hidden
                >
                  {selectedProduct ? (
                    <ProductOptionRow
                      name={selectedProduct.name}
                      imageUrl={selectedProduct.imageUrl}
                      size="sm"
                      className="text-white/90"
                    />
                  ) : (
                    <span className="text-white/60">
                      {productSelectPlaceholder}
                    </span>
                  )}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={productId || ""}
                  onValueChange={(value) => {
                    createSetValue(`items.${index}.productId`, value);
                    createSetValue(`items.${index}.quantity`, 1);
                    createSetValue(`items.${index}.warehouseId`, undefined);
                    void prefetchStockByProduct(queryClient, value);
                  }}
                  disabled={
                    isClientCreatingOrder && availableProducts.length === 0
                  }
                >
                  <SelectTrigger
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
                  >
                    <SelectValue placeholder={productSelectPlaceholder}>
                      {selectedProduct ? (
                        <ProductOptionRow
                          name={selectedProduct.name}
                          imageUrl={selectedProduct.imageUrl}
                          size="sm"
                          className="text-white/90"
                        />
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS)}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {availableProducts.length === 0 &&
                    isClientCreatingOrder &&
                    productOwner ? (
                      <div className="px-2 text-sm text-muted-foreground dark:text-white/80 text-center">
                        {productOwner.name} hasn&apos;t added any products yet
                      </div>
                    ) : (
                      availableProducts.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id}
                          className={cn("py-2", DIALOG_SELECT_ITEM_CLASS)}
                        >
                          <ProductOptionRow
                            name={product.name}
                            imageUrl={product.imageUrl}
                            price={Number(product.price)}
                            quantity={Number(product.quantity)}
                            size="sm"
                            showMeta
                          />
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
            {createErrors.items?.[index]?.productId && (
              <p className="text-red-500 text-xs">
                {String(createErrors.items[index]?.productId?.message)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <DialogFormLabel icon={Layers} required>
              Quantity
            </DialogFormLabel>
            <Input
              type="number"
              min="1"
              value={
                quantityValue !== undefined && quantityValue !== null
                  ? quantityValue.toString()
                  : ""
              }
              onChange={(e) => {
                const inputValue = e.target.value;
                if (
                  inputValue === "" ||
                  inputValue === null ||
                  inputValue === undefined
                ) {
                  createSetValue(`items.${index}.quantity`, undefined, {
                    shouldValidate: true,
                  });
                } else {
                  const parsedValue = parseInt(inputValue, 10);
                  if (!isNaN(parsedValue) && parsedValue > 0) {
                    createSetValue(`items.${index}.quantity`, parsedValue, {
                      shouldValidate: true,
                    });
                  } else {
                    createSetValue(`items.${index}.quantity`, undefined, {
                      shouldValidate: true,
                    });
                  }
                }
              }}
              placeholder="Enter quantity"
              className={cn(
                "h-11",
                DIALOG_FORM_FIELD_VIOLET,
                "[&:invalid]:border-violet-400/30",
              )}
            />
            {createErrors.items?.[index]?.quantity && (
              <p className="text-red-500 text-xs">
                {String(createErrors.items[index]?.quantity?.message)}
              </p>
            )}
          </div>

          <OrderLineWarehouseSelect
            productId={productId}
            value={warehouseId}
            onChange={(whId) =>
              createSetValue(`items.${index}.warehouseId`, whId)
            }
            dialogOpen={dialogOpen}
            manualPickError={manualPickError}
            allocationRows={allocationRows}
            allocationsLoading={allocationsLoading}
          />

          {selectedProduct ? (
            <div className="col-span-full md:col-span-3 flex flex-wrap justify-between gap-x-4 gap-y-1 pt-1">
              <div className="text-sm text-white/70 min-w-0 inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Subtotal:</span>
                <ProportionalPriceDisplay
                  listAmount={itemSubtotal}
                  size="sm"
                  className="text-white/90"
                />
                <span>
                  ({selectedProduct.name} × {quantity || 0})
                </span>
              </div>
              {showAutoAssignHint ? (
                <p className={cn(DIALOG_FORM_HINT_TEXT, "text-right max-w-sm")}>
                  {formatOrderLineAutoAssignHint(validation!.maxQty!)}
                </p>
              ) : null}
            </div>
          ) : null}

          {stockError ? (
            <p
              className={cn(
                DIALOG_FORM_ERROR_TEXT,
                "col-span-full md:col-span-3 flex items-center gap-1",
              )}
              role="alert"
            >
              <span>⚠️</span>
              <span>{stockError}</span>
            </p>
          ) : null}
        </div>

        {canRemove ? (
          <Button
            type="button"
            onClick={() => onRemove()}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
