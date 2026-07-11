"use client";

/**
 * TransferStockDialog — move stock between warehouses (REQ-0066).
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  DIALOG_FORM_FIELD_TEAL,
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { ProductOptionRow } from "@/components/products/ProductOptionRow";
import {
  useCreateStockTransfer,
  useWarehouses,
} from "@/hooks/queries";
import type { StockAllocation } from "@/types";
import { cn } from "@/lib/utils";

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

  const { data: warehouses = [] } = useWarehouses();
  const transferMutation = useCreateStockTransfer();

  const destinationOptions = useMemo(
    () => warehouses.filter((w) => w.id !== fromWarehouseId && w.status),
    [warehouses, fromWarehouseId],
  );

  const selectedAllocation = useMemo(
    () => stockAllocations.find((a) => a.productId === productId),
    [stockAllocations, productId],
  );

  const maxAvailable = selectedAllocation
    ? selectedAllocation.quantity - selectedAllocation.reservedQuantity
    : 0;

  const qtyNum = parseInt(quantity, 10);
  const isValid =
    !!productId &&
    !!toWarehouseId &&
    Number.isFinite(qtyNum) &&
    qtyNum >= 1 &&
    qtyNum <= maxAvailable;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setProductId("");
        setToWarehouseId("");
        setQuantity("");
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
  const allocatable = stockAllocations.filter(
    (a) => a.quantity - a.reservedQuantity > 0,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="poppins max-h-[90vh] flex flex-col overflow-hidden border-teal-400/30">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base text-white">
            Transfer Stock
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Move units from{" "}
            {fromWarehouseName ? `"${fromWarehouseName}"` : "this warehouse"} to
            another location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label className="text-sm text-white/80">Product *</Label>
            <Select
              value={productId}
              onValueChange={setProductId}
              disabled={isPending || allocatable.length === 0}
            >
              <SelectTrigger
                className={cn(
                  "mt-1 h-11 rounded-xl",
                  DIALOG_FORM_FIELD_TEAL,
                )}
              >
                <SelectValue placeholder="Select product in warehouse…" />
              </SelectTrigger>
              <SelectContent>
                {allocatable.map((a) => (
                  <SelectItem key={a.id} value={a.productId}>
                    <ProductOptionRow
                      name={a.product?.name ?? "Product"}
                      imageUrl={a.product?.imageUrl}
                      quantity={a.quantity - a.reservedQuantity}
                      showMeta
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allocatable.length === 0 && (
              <p className="mt-1 text-xs text-white/60">
                No available stock to transfer from this warehouse.
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm text-white/80">Destination *</Label>
            <Select
              value={toWarehouseId}
              onValueChange={setToWarehouseId}
              disabled={isPending || destinationOptions.length === 0}
            >
              <SelectTrigger
                className={cn(
                  "mt-1 h-11 rounded-xl",
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

          <div>
            <Label htmlFor="transfer-qty" className="text-sm text-white/80">
              Quantity *{" "}
              {selectedAllocation ? `(max ${maxAvailable})` : null}
            </Label>
            <Input
              id="transfer-qty"
              type="number"
              min={1}
              max={maxAvailable || undefined}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isPending || !productId}
              placeholder="1"
              className={cn("mt-1 h-11 rounded-xl", DIALOG_FORM_FIELD_TEAL)}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className={cn("w-full sm:w-auto px-8", GLASS_GHOST_BUTTON)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ghost"
              disabled={!isValid || isPending}
              className={cn(
                GLASS_BUTTON_ICON_HOVER,
                GLASS_BUTTON_SHELL_RESET,
                GLASS_BUTTON_DISABLED,
                "w-full sm:w-auto px-8",
                GLASS_PRIMARY_BUTTON.teal,
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Transfer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
