"use client";

/**
 * TransferStockDialog — move stock between warehouses (REQ-0066).
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronDown } from "lucide-react";
import {
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_FORM_FIELD_TEAL,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
  StockQuantityField,
  getStockQuantityValidation,
} from "@/components/shared";
import { ProductOptionRow } from "@/components/products/ProductOptionRow";
import {
  useCreateStockTransfer,
  useWarehouses,
} from "@/hooks/queries";
import type { StockAllocation } from "@/types";
import { cn } from "@/lib/utils";

const TRANSFER_DIALOG_CONTENT_CLASS = `${DIALOG_EDGE_SCROLL_SHELL} poppins border-teal-400/30 dark:border-teal-400/30 shadow-[0_30px_80px_rgba(20,184,166,0.35)] dark:shadow-[0_30px_80px_rgba(20,184,166,0.25)]`;

export type TransferStockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  /** Current stock rows in source warehouse (for product + max qty). */
  stockAllocations?: StockAllocation[];
};

export default function TransferStockDialog({
  open,
  onOpenChange,
  fromWarehouseId,
  fromWarehouseName,
  stockAllocations = [],
}: TransferStockDialogProps) {
  const [productId, setProductId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: warehouses = [] } = useWarehouses();
  const transferMutation = useCreateStockTransfer();

  const destinationOptions = useMemo(
    () => warehouses.filter((w) => w.id !== fromWarehouseId && w.status),
    [warehouses, fromWarehouseId],
  );

  const allocatable = useMemo(
    () =>
      stockAllocations.filter(
        (a) => a.quantity - a.reservedQuantity > 0,
      ),
    [stockAllocations],
  );

  const selectedAllocation = useMemo(
    () => stockAllocations.find((a) => a.productId === productId),
    [stockAllocations, productId],
  );

  const maxAvailable = selectedAllocation
    ? selectedAllocation.quantity - selectedAllocation.reservedQuantity
    : 0;

  const qtyValidation = getStockQuantityValidation(
    quantity,
    maxAvailable,
    "transfer",
  );
  const qtyNum = parseInt(quantity, 10);
  const isValid =
    !!productId &&
    !!toWarehouseId &&
    qtyValidation.valid &&
    Number.isFinite(qtyNum) &&
    qtyNum >= 1 &&
    qtyNum <= maxAvailable;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setProductId("");
        setToWarehouseId("");
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
      transferMutation.mutate(
        {
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity: qtyNum,
        },
        { onSuccess: () => handleOpenChange(false) },
      );
    },
    [
      fromWarehouseId,
      handleOpenChange,
      isValid,
      productId,
      qtyNum,
      toWarehouseId,
      transferMutation,
    ],
  );

  const isPending = transferMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={TRANSFER_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={DIALOG_EDGE_SCROLL_HEADER}>
          <DialogTitle className="text-[22px] text-white">
            Transfer Stock
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Move units from{" "}
            {fromWarehouseName ? `"${fromWarehouseName}"` : "this warehouse"}{" "}
            to another location.
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
                      disabled={
                        isPending || allocatable.length === 0
                      }
                      className={cn(
                        "mt-1 h-auto min-h-11 w-full justify-between py-2 font-normal",
                        DIALOG_FORM_FIELD_TEAL,
                      )}
                    >
                      {selectedAllocation?.product ? (
                        <ProductOptionRow
                          name={selectedAllocation.product.name}
                          imageUrl={selectedAllocation.product.imageUrl}
                          price={selectedAllocation.product.price}
                          availableQuantity={
                            selectedAllocation.quantity -
                            selectedAllocation.reservedQuantity
                          }
                          categoryName={
                            selectedAllocation.product.categoryName
                          }
                          supplierName={
                            selectedAllocation.product.supplierName
                          }
                          showMeta
                          metaOnDark
                          size="sm"
                          className="flex-1"
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          Select product in warehouse…
                        </span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-[28px] border border-teal-400/20 bg-white/80 dark:bg-popover/50 backdrop-blur-md"
                  >
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Search products…" />
                      <CommandList className="max-h-[min(60vh,280px)]">
                        <CommandEmpty>No products in this warehouse.</CommandEmpty>
                        <CommandGroup>
                          {allocatable.map((a) => {
                            const avail = a.quantity - a.reservedQuantity;
                            return (
                              <CommandItem
                                key={a.id}
                                value={`${a.product?.name ?? ""} ${a.product?.sku ?? ""}`}
                                onSelect={() => {
                                  setProductId(a.productId);
                                  setPickerOpen(false);
                                }}
                                className="py-2"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    productId === a.productId
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <ProductOptionRow
                                  name={a.product?.name ?? "Product"}
                                  imageUrl={a.product?.imageUrl}
                                  price={a.product?.price}
                                  availableQuantity={avail}
                                  categoryName={a.product?.categoryName}
                                  supplierName={a.product?.supplierName}
                                  showMeta
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {allocatable.length === 0 && (
                  <p className="mt-1 text-xs text-white/60">
                    No available stock to transfer from this warehouse.
                  </p>
                )}
              </div>

              <div className="min-h-11">
                <Label className="text-sm text-white/80">Destination *</Label>
                <Select
                  value={toWarehouseId}
                  onValueChange={setToWarehouseId}
                  disabled={
                    isPending || destinationOptions.length === 0
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "mt-1 h-11 w-full rounded-xl",
                      DIALOG_FORM_FIELD_TEAL,
                    )}
                  >
                    <SelectValue placeholder="Select warehouse…" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationOptions.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <StockQuantityField
                id="transfer-qty"
                value={quantity}
                onChange={setQuantity}
                maxAvailable={maxAvailable}
                mode="transfer"
                disabled={isPending || !productId}
                fieldClassName={DIALOG_FORM_FIELD_TEAL}
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
                pendingLabel="Transferring…"
                label="Transfer"
                hue="teal"
                disabled={!isValid}
              />
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
