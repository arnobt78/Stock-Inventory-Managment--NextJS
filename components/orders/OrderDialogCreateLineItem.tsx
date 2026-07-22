"use client";

/**
 * REQ-0111 — single create-order line row with reactive stock validation hook.
 * REQ-0187 — Product Combobox densify (DialogProductOptionRow + search); Subtotal under Product;
 * warehouse Max/hint under Warehouse column.
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { UseFormSetValue, FieldErrors } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Layers, Package, X } from "lucide-react";
import {
  DialogProductOptionRow,
  productCategoryLabel,
  productSupplierId,
  productSupplierImage,
  productSupplierLabel,
} from "@/components/products/ProductOptionRow";
import { OrderLineWarehouseSelect } from "@/components/orders/OrderLineWarehouseSelect";
import {
  DIALOG_COMBOBOX_TRIGGER_CLASS,
  DialogFormLabel,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_ERROR_TEXT,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  filterCommandPopoverClass,
  ProportionalPriceDisplay,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  prefetchStockByProduct,
  useOrderLineStockValidation,
} from "@/hooks/queries";
import type { OrderLineStockProduct } from "@/lib/orders/order-line-stock-validation";
import { formatOrderLineAutoAssignHint } from "@/lib/orders/order-line-stock-validation";
import type { Product } from "@/types";

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

/**
 * Product shape for create-order line UI + stock hook (REQ-0111 / REQ-0187 densify).
 * Compatible with Product list/browse rows from useProducts / useClientBrowseProducts.
 */
export type OrderDialogLineProduct = OrderLineStockProduct & {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number | string;
  sku?: string | null;
  userId?: string;
  productOwnerName?: string | null;
  productOwnerImage?: string | null;
  supplierId?: string | null;
  supplierImage?: string | null;
  supplier?: Product["supplier"];
  category?: Product["category"];
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
  const [pickerOpen, setPickerOpen] = useState(false);

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

  // REQ-0112 / Sentry — manual pick "Max N at Warehouse" must disable Create (not only catalog stockError)
  useEffect(() => {
    onStockValidityChange(lineId, Boolean(stockError || manualPickError));
  }, [lineId, onStockValidityChange, stockError, manualPickError]);

  const itemSubtotal =
    selectedProduct && quantity > 0
      ? Number(selectedProduct.price) * quantity
      : 0;

  const selectProduct = (nextId: string) => {
    createSetValue(`items.${index}.productId`, nextId);
    createSetValue(`items.${index}.quantity`, 1);
    createSetValue(`items.${index}.warehouseId`, undefined);
    void prefetchStockByProduct(queryClient, nextId);
    setPickerOpen(false);
  };

  const productDisabled =
    isClientCreatingOrder && availableProducts.length === 0;

  return (
    <div className="p-4 border border-violet-400/20 rounded-lg bg-white/5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)] gap-2 items-start">
          <div className="flex flex-col gap-2">
            <DialogFormLabel icon={Package} required>
              Product {index + 1}
            </DialogFormLabel>
            {/* REQ-0187 — Allocate-style searchable Combobox + DialogProductOptionRow */}
            <Popover
              open={dialogOpen && pickerOpen}
              onOpenChange={(next) => {
                if (dialogOpen) setPickerOpen(next);
              }}
              modal
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  disabled={productDisabled}
                  className={cn(
                    "h-auto min-h-11 w-full justify-between py-2",
                    DIALOG_COMBOBOX_TRIGGER_CLASS,
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                >
                  {selectedProduct ? (
                    <DialogProductOptionRow
                      name={selectedProduct.name}
                      imageUrl={selectedProduct.imageUrl}
                      sku={selectedProduct.sku}
                      price={Number(selectedProduct.price)}
                      quantity={Number(selectedProduct.quantity)}
                      reservedQuantity={selectedProduct.reservedQuantity}
                      categoryName={productCategoryLabel(
                        selectedProduct.category,
                      )}
                      ownerId={selectedProduct.userId}
                      ownerName={selectedProduct.productOwnerName}
                      ownerImage={selectedProduct.productOwnerImage}
                      supplierId={productSupplierId(selectedProduct)}
                      supplierName={productSupplierLabel(
                        selectedProduct.supplier,
                      )}
                      supplierImage={productSupplierImage(selectedProduct)}
                      metaOnDark
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-white/60">
                      {productSelectPlaceholder}
                    </span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                onCloseAutoFocus={(e) => e.preventDefault()}
                className={cn(
                  "w-[var(--radix-popover-trigger-width)] p-0",
                  filterCommandPopoverClass("violet"),
                  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
                )}
              >
                <Command className="bg-transparent">
                  <CommandInput placeholder="Search products…" />
                  <CommandList className="max-h-[min(60vh,280px)]">
                    <CommandEmpty>
                      {availableProducts.length === 0 &&
                      isClientCreatingOrder &&
                      productOwner
                        ? `${productOwner.name} hasn't added any products yet`
                        : "No products found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {availableProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.name} ${product.sku ?? ""} ${productCategoryLabel(product.category) ?? ""} ${productSupplierLabel(product.supplier) ?? ""}`}
                          onSelect={() => selectProduct(product.id)}
                          className="relative py-2 pr-8"
                        >
                          <DialogProductOptionRow
                            name={product.name}
                            imageUrl={product.imageUrl}
                            sku={product.sku}
                            price={Number(product.price)}
                            quantity={Number(product.quantity)}
                            reservedQuantity={product.reservedQuantity}
                            categoryName={productCategoryLabel(
                              product.category,
                            )}
                            ownerId={product.userId}
                            ownerName={product.productOwnerName}
                            ownerImage={product.productOwnerImage}
                            supplierId={productSupplierId(product)}
                            supplierName={productSupplierLabel(
                              product.supplier,
                            )}
                            supplierImage={productSupplierImage(product)}
                          />
                          <Check
                            className={cn(
                              "absolute right-2 h-4 w-4 shrink-0",
                              productId === product.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {createErrors.items?.[index]?.productId && (
              <p className={DIALOG_FORM_ERROR_TEXT}>
                {String(createErrors.items[index]?.productId?.message)}
              </p>
            )}
            {/* REQ-0187 gap — Subtotal under Product column */}
            {selectedProduct ? (
              <div className="text-sm text-white/70 min-w-0 inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Subtotal:</span>
                <ProportionalPriceDisplay
                  listAmount={itemSubtotal}
                  className="text-white/90"
                />
                <span>
                  ({selectedProduct.name} × {quantity || 0})
                </span>
              </div>
            ) : null}
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
              <p className={DIALOG_FORM_ERROR_TEXT}>
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
            catalogStockError={stockError}
            hintText={
              showAutoAssignHint
                ? formatOrderLineAutoAssignHint(validation!.maxQty!)
                : null
            }
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
    </div>
  );
}
