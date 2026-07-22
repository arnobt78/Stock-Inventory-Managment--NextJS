"use client";

/**
 * AllocateStockDialog — assign product quantity to a warehouse (REQ-0066).
 * Shell matches CategoryDialog (edge scroll + outer glow).
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Check, ChevronDown, Package, Save, X } from "lucide-react";
import {
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_COMBOBOX_TRIGGER_CLASS,
  DIALOG_FORM_FEEDBACK_ROW,
  DIALOG_FORM_FIELD_VIOLET,
  DialogFormLabel,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
  StockQuantityField,
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  getStockQuantityValidation,
} from "@/components/shared";
import {
  DialogProductOptionRow,
  productCategoryLabel,
  productSupplierId,
  productSupplierImage,
  productSupplierLabel,
} from "@/components/products/ProductOptionRow";
import { useCreateStockAllocation, useProducts, useStockByProduct, useUpdateStockAllocation } from "@/hooks/queries";
import { getAllocationQtyBounds } from "@/lib/stock-allocation/validate-allocation-quantity";
import type { Product, StockAllocation } from "@/types";
import { cn } from "@/lib/utils";

const ALLOCATE_DIALOG_CONTENT_CLASS = `${DIALOG_EDGE_SCROLL_SHELL} poppins border-violet-400/30 dark:border-violet-400/30 shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]`;

export type AllocateStockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName?: string;
  /** Edit existing row — product locked, quantity upserted for this warehouse. */
  editAllocation?: StockAllocation | null;
};

export default function AllocateStockDialog({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  editAllocation = null,
}: AllocateStockDialogProps) {
  const isEditMode = Boolean(editAllocation);
  const [productId, setProductId] = useState(editAllocation?.productId ?? "");
  const [quantity, setQuantity] = useState(
    editAllocation != null ? String(editAllocation.quantity) : "",
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const activeProductId = isEditMode
    ? (editAllocation?.productId ?? "")
    : productId;
  const { data: productAllocations = [] } = useStockByProduct(
    activeProductId,
    undefined,
    { enabled: open && !!activeProductId },
  );
  const createMutation = useCreateStockAllocation();
  const updateMutation = useUpdateStockAllocation();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === activeProductId),
    [products, activeProductId],
  );

  const allocationRows = useMemo(
    () =>
      productAllocations.map((row) => ({
        warehouseId: row.warehouseId,
        quantity: row.quantity,
      })),
    [productAllocations],
  );

  const rowReserved =
    isEditMode && editAllocation
      ? Number(editAllocation.reservedQuantity ?? 0)
      : 0;

  const allocationBounds = useMemo(() => {
    if (!selectedProduct) return null;
    return getAllocationQtyBounds({
      catalogQty: selectedProduct.quantity,
      allocations: allocationRows,
      targetWarehouseId: warehouseId,
      newAbsoluteQty: 0,
      rowReserved,
    });
  }, [allocationRows, rowReserved, selectedProduct, warehouseId]);

  const maxProductStock = allocationBounds?.maxQty ?? 0;
  const allocatedTotal = allocationRows.reduce(
    (sum, row) => sum + row.quantity,
    0,
  );
  const qtyValidation = getStockQuantityValidation(
    quantity,
    maxProductStock,
    "allocate",
    rowReserved,
  );
  const qtyNum = parseInt(quantity, 10);
  const isValid =
    !!activeProductId &&
    qtyValidation.valid &&
    Number.isFinite(qtyNum) &&
    qtyNum >= 0 &&
    qtyNum >= rowReserved &&
    !!warehouseId;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setProductId("");
        setQuantity("");
        setPickerOpen(false);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;

      if (isEditMode && editAllocation) {
        updateMutation.mutate(
          { id: editAllocation.id, quantity: qtyNum },
          { onSuccess: () => handleOpenChange(false) },
        );
        return;
      }

      createMutation.mutate(
        { productId: activeProductId, warehouseId, quantity: qtyNum },
        { onSuccess: () => handleOpenChange(false) },
      );
    },
    [
      createMutation,
      updateMutation,
      handleOpenChange,
      isValid,
      isEditMode,
      editAllocation,
      activeProductId,
      qtyNum,
      warehouseId,
    ],
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={ALLOCATE_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={DIALOG_EDGE_SCROLL_HEADER}>
          <DialogTitle className="text-[22px] text-white">
            {isEditMode ? "Update Allocation" : "Allocate Stock"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {isEditMode
              ? `Change allocated quantity in ${warehouseName ? `"${warehouseName}"` : "this warehouse"}.`
              : (
                  <>
                    Assign product quantity to{" "}
                    {warehouseName ? `"${warehouseName}"` : "this warehouse"}.
                  </>
                )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={DIALOG_EDGE_SCROLL_BODY}>
          <div className={DIALOG_EDGE_SCROLL_INNER}>
            <div className="mt-2 space-y-4">
              <div>
                <DialogFormLabel icon={Package} required>
                  Product
                </DialogFormLabel>
                {/* REQ-0199 — modal Combobox; ghost trigger (no outline→white hover) */}
                <Popover open={pickerOpen} onOpenChange={setPickerOpen} modal>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      role="combobox"
                      disabled={productsLoading || isPending || isEditMode}
                      className={cn(
                        "mt-1 h-auto min-h-11 w-full justify-between py-2",
                        DIALOG_COMBOBOX_TRIGGER_CLASS,
                        DIALOG_FORM_FIELD_VIOLET,
                      )}
                    >
                      {selectedProduct ? (
                        <DialogProductOptionRow
                          name={selectedProduct.name}
                          imageUrl={selectedProduct.imageUrl}
                          sku={selectedProduct.sku}
                          price={selectedProduct.price}
                          quantity={selectedProduct.quantity}
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
                        <span className="text-muted-foreground">
                          Select product…
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
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                          {products.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.name} ${p.sku ?? ""} ${productCategoryLabel(p.category) ?? ""} ${productSupplierLabel(p.supplier) ?? ""}`}
                              onSelect={() => {
                                setProductId(p.id);
                                setPickerOpen(false);
                              }}
                              className="relative py-2 pr-8"
                            >
                              <DialogProductOptionRow
                                name={p.name}
                                imageUrl={p.imageUrl}
                                sku={p.sku}
                                price={p.price}
                                quantity={p.quantity}
                                categoryName={productCategoryLabel(p.category)}
                                ownerId={p.userId}
                                ownerName={p.productOwnerName}
                                ownerImage={p.productOwnerImage}
                                supplierId={productSupplierId(p)}
                                supplierName={productSupplierLabel(p.supplier)}
                                supplierImage={productSupplierImage(p)}
                              />
                              <Check
                                className={cn(
                                  "absolute right-2 h-4 w-4 shrink-0",
                                  productId === p.id
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
              </div>

              <div className={DIALOG_FORM_FEEDBACK_ROW}>
                <StockQuantityField
                  id="alloc-qty"
                  value={quantity}
                  onChange={setQuantity}
                  maxAvailable={maxProductStock}
                  catalogTotal={selectedProduct?.quantity}
                  allocatedTotal={allocatedTotal}
                  unallocatedRemaining={allocationBounds?.unallocated}
                  minReserved={rowReserved}
                  mode="allocate"
                  disabled={isPending || !activeProductId}
                  fieldClassName={DIALOG_FORM_FIELD_VIOLET}
                />
              </div>
            </div>

            <DialogFooter className="mt-9 mb-4 flex w-full min-w-0 flex-col sm:flex-row items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className={cn("w-full sm:w-auto px-11 gap-2", GLASS_GHOST_BUTTON)}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
              <DialogSubmitButton
                isPending={isPending}
                pendingLabel="Saving allocation…"
                label={isEditMode ? "Save changes" : "Save allocation"}
                icon={Save}
                hue="violet"
                disabled={!isValid}
              />
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
