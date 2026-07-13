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
import { Label } from "@/components/ui/label";
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
import { Check, ChevronDown } from "lucide-react";
import {
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_FORM_FIELD_VIOLET,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
  StockQuantityField,
  getStockQuantityValidation,
} from "@/components/shared";
import {
  ProductOptionRow,
  productCategoryLabel,
  productSupplierLabel,
} from "@/components/products/ProductOptionRow";
import { useCreateStockAllocation, useProducts, useStockByProduct, useUpdateStockAllocation } from "@/hooks/queries";
import { computeAllocateBudget } from "@/lib/stock-allocation/compute-allocate-budget";
import type { StockAllocation } from "@/types";
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

  const allocateBudget = useMemo(() => {
    if (!selectedProduct) return null;
    return computeAllocateBudget(
      selectedProduct.quantity,
      productAllocations.map((row) => ({
        warehouseId: row.warehouseId,
        quantity: row.quantity,
      })),
      warehouseId,
    );
  }, [productAllocations, selectedProduct, warehouseId]);

  const maxProductStock = allocateBudget?.maxSetQuantity ?? 0;
  const qtyValidation = getStockQuantityValidation(
    quantity,
    maxProductStock,
    "allocate",
  );
  const qtyNum = parseInt(quantity, 10);
  const isValid =
    !!activeProductId &&
    qtyValidation.valid &&
    Number.isFinite(qtyNum) &&
    qtyNum >= 0 &&
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
                <Label className="text-sm text-white/80">Product *</Label>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      disabled={productsLoading || isPending || isEditMode}
                      className={cn(
                        "mt-1 h-auto min-h-11 w-full justify-between py-2 font-normal",
                        DIALOG_FORM_FIELD_VIOLET,
                      )}
                    >
                      {selectedProduct ? (
                        <ProductOptionRow
                          name={selectedProduct.name}
                          imageUrl={selectedProduct.imageUrl}
                          price={selectedProduct.price}
                          quantity={selectedProduct.quantity}
                          categoryName={productCategoryLabel(
                            selectedProduct.category,
                          )}
                          supplierName={productSupplierLabel(
                            selectedProduct.supplier,
                          )}
                          showMeta
                          metaOnDark
                          size="sm"
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
                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-[28px] border border-violet-400/20 bg-white/80 dark:bg-popover/50 backdrop-blur-md"
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
                              className="py-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  productId === p.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <ProductOptionRow
                                name={p.name}
                                imageUrl={p.imageUrl}
                                price={p.price}
                                quantity={p.quantity}
                                categoryName={productCategoryLabel(p.category)}
                                supplierName={productSupplierLabel(p.supplier)}
                                showMeta
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <StockQuantityField
                id="alloc-qty"
                value={quantity}
                onChange={setQuantity}
                maxAvailable={maxProductStock}
                catalogTotal={allocateBudget?.catalogTotal}
                allocatedTotal={allocateBudget?.totalAllocated}
                unallocatedRemaining={allocateBudget?.unallocated}
                mode="allocate"
                disabled={isPending || !activeProductId}
                fieldClassName={DIALOG_FORM_FIELD_VIOLET}
              />
            </div>

            <DialogFooter className="mt-9 mb-4 flex w-full min-w-0 flex-col sm:flex-row items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className={cn("w-full sm:w-auto px-11", GLASS_GHOST_BUTTON)}
              >
                Cancel
              </Button>
              <DialogSubmitButton
                isPending={isPending}
                pendingLabel="Saving allocation…"
                label={isEditMode ? "Save changes" : "Save allocation"}
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
