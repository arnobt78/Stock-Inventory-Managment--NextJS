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
import { Check, ChevronDown, ArrowRightLeft, Package, Warehouse, X } from "lucide-react";
import {
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_COMBOBOX_TRIGGER_CLASS,
  DIALOG_FORM_FIELD_TEAL,
  DialogFormLabel,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
  StockQuantityField,
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  SelectEmptyContent,
  resolveSelectPlaceholder,
  getStockQuantityValidation,
} from "@/components/shared";
import {
  DialogProductOptionRow,
  productSupplierId,
  productSupplierImage,
} from "@/components/products/ProductOptionRow";
import { WarehouseTypeBadge } from "@/lib/ui/semantic-badges";
import {
  useCreateStockTransfer,
  useProducts,
  useWarehouses,
} from "@/hooks/queries";
import type { Product, StockAllocation } from "@/types";
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
  // REQ-0203 gap — join catalog products for owner/supplier densify on picker rows
  const { data: products = [] } = useProducts();
  const transferMutation = useCreateStockTransfer();

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

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

  const selectedCatalog = productId
    ? productById.get(productId)
    : undefined;

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
                      disabled={
                        isPending || allocatable.length === 0
                      }
                      className={cn(
                        "mt-1 h-auto min-h-11 w-full justify-between py-2",
                        DIALOG_COMBOBOX_TRIGGER_CLASS,
                        DIALOG_FORM_FIELD_TEAL,
                      )}
                    >
                      {selectedAllocation?.product ? (
                        <DialogProductOptionRow
                          name={selectedAllocation.product.name}
                          imageUrl={selectedAllocation.product.imageUrl}
                          sku={selectedAllocation.product.sku}
                          price={selectedAllocation.product.price}
                          quantity={
                            selectedAllocation.quantity -
                            selectedAllocation.reservedQuantity
                          }
                          categoryName={
                            selectedAllocation.product.categoryName
                          }
                          ownerId={selectedCatalog?.userId}
                          ownerName={selectedCatalog?.productOwnerName}
                          ownerImage={selectedCatalog?.productOwnerImage}
                          supplierId={
                            selectedCatalog
                              ? productSupplierId(selectedCatalog)
                              : selectedAllocation.product.supplierId
                          }
                          supplierName={
                            selectedAllocation.product.supplierName
                          }
                          supplierImage={
                            selectedCatalog
                              ? productSupplierImage(selectedCatalog)
                              : undefined
                          }
                          metaOnDark
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
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className={cn(
                      "w-[var(--radix-popover-trigger-width)] p-0",
                      filterCommandPopoverClass("teal"),
                      FILTER_COMMAND_INPUT_WRAPPER_CLASS,
                    )}
                  >
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Search products…" />
                      <CommandList className="max-h-[min(60vh,280px)]">
                        <CommandEmpty>No products in this warehouse.</CommandEmpty>
                        <CommandGroup>
                          {allocatable.map((a) => {
                            const avail = a.quantity - a.reservedQuantity;
                            const catalog = productById.get(a.productId);
                            return (
                              <CommandItem
                                key={a.id}
                                value={`${a.product?.name ?? ""} ${a.product?.sku ?? ""} ${catalog?.productOwnerName ?? ""}`}
                                onSelect={() => {
                                  setProductId(a.productId);
                                  setPickerOpen(false);
                                }}
                                className="relative py-2 pr-8"
                              >
                                <DialogProductOptionRow
                                  name={a.product?.name ?? "Product"}
                                  imageUrl={a.product?.imageUrl}
                                  sku={a.product?.sku}
                                  price={a.product?.price}
                                  quantity={avail}
                                  categoryName={a.product?.categoryName}
                                  ownerId={catalog?.userId}
                                  ownerName={catalog?.productOwnerName}
                                  ownerImage={catalog?.productOwnerImage}
                                  supplierId={
                                    catalog
                                      ? productSupplierId(catalog)
                                      : a.product?.supplierId
                                  }
                                  supplierName={a.product?.supplierName}
                                  supplierImage={
                                    catalog
                                      ? productSupplierImage(catalog)
                                      : undefined
                                  }
                                />
                                <Check
                                  className={cn(
                                    "absolute right-2 h-4 w-4 shrink-0",
                                    productId === a.productId
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
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
                <DialogFormLabel icon={Warehouse} required>
                  Destination
                </DialogFormLabel>
                {/* REQ-0203 — type badge + name; Select check stays right */}
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
                    <SelectValue
                      placeholder={resolveSelectPlaceholder("warehouse", {
                        count: destinationOptions.length,
                        invite: "Select warehouse…",
                      })}
                    >
                      {toWarehouseId
                        ? (() => {
                            const w = destinationOptions.find(
                              (d) => d.id === toWarehouseId,
                            );
                            if (!w) return null;
                            return (
                              <span className="flex min-w-0 items-center gap-2">
                                {w.type ? (
                                  <WarehouseTypeBadge
                                    type={w.type}
                                    size="compact"
                                    contrast="solid"
                                  />
                                ) : null}
                                <span className="truncate text-sm text-white">
                                  {w.name}
                                </span>
                              </span>
                            );
                          })()
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS)}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {destinationOptions.length === 0 ? (
                      <SelectEmptyContent entity="warehouse" />
                    ) : (
                      destinationOptions.map((w) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          className={DIALOG_SELECT_ITEM_CLASS}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            {w.type ? (
                              <WarehouseTypeBadge
                                type={w.type}
                                size="compact"
                                contrast="opaque"
                              />
                            ) : null}
                            <span className="truncate">{w.name}</span>
                          </span>
                        </SelectItem>
                      ))
                    )}
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
                className={cn("w-full sm:w-auto px-11 gap-2", GLASS_GHOST_BUTTON)}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
              <DialogSubmitButton
                isPending={isPending}
                pendingLabel="Transferring…"
                label="Transfer"
                icon={ArrowRightLeft}
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
