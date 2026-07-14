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
import { Label } from "@/components/ui/label";
import type { UseFormSetValue, FieldErrors } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Layers, X } from "lucide-react";
import { ProductOptionRow } from "@/components/products/ProductOptionRow";
import { OrderLineWarehouseSelect } from "@/components/orders/OrderLineWarehouseSelect";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_FEEDBACK_ROW,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  prefetchStockByProduct,
  useOrderLineStockValidation,
} from "@/hooks/queries";
import type { OrderLineStockProduct } from "@/lib/orders/order-line-stock-validation";

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
    validation && quantity > 0 && !validation.ok ? validation.message : null;

  const manualPickError =
    validation?.mode === "manual" && !validation.ok
      ? validation.message
      : null;

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
            <Label className="flex items-center gap-2 text-white/80 text-sm">
              <Package className="h-4 w-4 shrink-0 text-violet-400" />
              Product {index + 1}
            </Label>
            <DeferredSelectGate
              enabled={dialogOpen}
              placeholder={
                <div
                  className="flex h-11 w-full items-center rounded-md border border-violet-400/30 bg-white/10 px-2 text-sm"
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
                    className="border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {availableProducts.length === 0 &&
                    isClientCreatingOrder &&
                    productOwner ? (
                      <div className="px-2 text-sm text-muted-foreground dark:text-white/60 text-center">
                        {productOwner.name} hasn&apos;t added any products yet
                      </div>
                    ) : (
                      availableProducts.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id}
                          className="cursor-pointer py-2 text-gray-700 dark:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
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
            <Label className="flex items-center gap-2 text-white/80 text-sm">
              <Layers className="h-4 w-4 shrink-0 text-violet-400" />
              Quantity
            </Label>
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
            catalogAvailable={validation?.maxQty}
            hasAllocations={hasAllocations}
            manualPickError={manualPickError}
            allocationRows={allocationRows}
            allocationsLoading={allocationsLoading}
          />
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

      {selectedProduct ? (
        <div className={DIALOG_FORM_FEEDBACK_ROW}>
          <div className="text-sm text-white/70">
            Subtotal: ${itemSubtotal.toFixed(2)} ({selectedProduct.name} ×{" "}
            {quantity || 0})
          </div>
          {stockError ? (
            <p
              className={cn(DIALOG_FORM_ERROR_TEXT, "flex items-center gap-1")}
              role="alert"
            >
              <span>⚠️</span>
              <span>{stockError}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
