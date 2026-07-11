"use client";

/**
 * AllocateStockDialog — assign product quantity to a warehouse (REQ-0066).
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
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { ProductOptionRow } from "@/components/products/ProductOptionRow";
import { useCreateStockAllocation, useProducts } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export type AllocateStockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName?: string;
};

export default function AllocateStockDialog({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
}: AllocateStockDialogProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const createMutation = useCreateStockAllocation();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const qtyNum = parseInt(quantity, 10);
  const isValid =
    !!productId && Number.isFinite(qtyNum) && qtyNum >= 0 && !!warehouseId;

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
      createMutation.mutate(
        { productId, warehouseId, quantity: qtyNum },
        {
          onSuccess: () => handleOpenChange(false),
        },
      );
    },
    [createMutation, handleOpenChange, isValid, productId, qtyNum, warehouseId],
  );

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="poppins max-h-[90vh] flex flex-col overflow-hidden border-violet-400/30">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base text-white">
            Allocate Stock
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Assign product quantity to{" "}
            {warehouseName ? `"${warehouseName}"` : "this warehouse"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
          <div>
            <Label className="text-sm text-white/80">Product *</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  disabled={productsLoading || isPending}
                  className={cn(
                    "mt-1 h-11 w-full justify-between font-normal",
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                >
                  {selectedProduct ? (
                    <ProductOptionRow
                      name={selectedProduct.name}
                      imageUrl={selectedProduct.imageUrl}
                      size="sm"
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      Select product…
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="p-0 w-[min(100vw-2rem,400px)] rounded-[28px] border border-violet-400/20 bg-white/80 dark:bg-popover/50 backdrop-blur-md"
              >
                <Command className="bg-transparent">
                  <CommandInput placeholder="Search products…" />
                  <CommandList className="max-h-[min(60vh,280px)]">
                    <CommandEmpty>No products found.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name} ${p.sku ?? ""}`}
                          onSelect={() => {
                            setProductId(p.id);
                            setPickerOpen(false);
                          }}
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

          <div>
            <Label htmlFor="alloc-qty" className="text-sm text-white/80">
              Quantity *
            </Label>
            <Input
              id="alloc-qty"
              type="number"
              min={0}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isPending}
              placeholder="0"
              className={cn("mt-1 h-11 rounded-xl", DIALOG_FORM_FIELD_VIOLET)}
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
                GLASS_PRIMARY_BUTTON.violet,
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save allocation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
