"use client";

import React, { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Package,
  Tag,
  Truck,
  ShoppingCart,
  FileText,
  Warehouse,
} from "lucide-react";
import AddProductDialog from "@/components/products/ProductFormDialog";
import AddCategoryDialog from "@/components/category/CategoryDialog";
import AddSupplierDialog from "@/components/supplier/SupplierDialog";
import OrderDialog from "@/components/orders/OrderDialog";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import WarehouseDialog from "@/components/warehouses/WarehouseDialog";
import { Product } from "@/types";
import { fabButtonClass } from "@/lib/ui/fab-button-styles";
import type { GlassFocusHue } from "@/lib/ui/focus-ring-styles";

export type FloatingActionButtonsVariant =
  | "home"
  | "orders"
  | "invoices"
  | "suppliers"
  | "warehouses"
  | "categories"
  | "products"
  | "products-client";

interface FloatingActionButtonsProps {
  variant?: FloatingActionButtonsVariant;
  allProducts?: Product[];
  userId?: string;
  selectedOwnerId?: string;
}

const FabButton = React.forwardRef<
  HTMLButtonElement,
  {
    hue: GlassFocusHue;
    expanded: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function FabButton(
  { hue, expanded, disabled, children, className, onClick, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(fabButtonClass(hue, expanded), className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
});
FabButton.displayName = "FabButton";

export default function FloatingActionButtons({
  variant = "home",
  allProducts = [],
  userId = "",
  selectedOwnerId = "",
}: FloatingActionButtonsProps) {
  const [expandRequested, setExpandRequested] = useState(false);
  const anyDialogOpenRef = useRef(false);

  const isExpanded = expandRequested;

  const handleFabPointerDown = useCallback(() => {
    setExpandRequested(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setExpandRequested(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!anyDialogOpenRef.current) {
      setExpandRequested(false);
    }
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    anyDialogOpenRef.current = open;
    if (!open) {
      setExpandRequested(false);
    }
  }, []);

  const labelClass = (expanded: boolean) =>
    `overflow-hidden whitespace-nowrap transition-all duration-300 ${
      expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
    }`;

  const wrapClass = (expanded: boolean) =>
    `relative flex justify-end transition-all duration-300 ${
      expanded ? "w-[160px]" : "w-14"
    }`;

  const fabClickProps = { onPointerDown: handleFabPointerDown };

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {variant === "home" && (
        <div className={wrapClass(isExpanded)}>
          <AddProductDialog
            allProducts={allProducts}
            userId={userId}
            onOpenChange={handleDialogOpenChange}
          >
            <FabButton hue="rose" expanded={isExpanded} {...fabClickProps}>
              <Package className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Product</span>
            </FabButton>
          </AddProductDialog>
        </div>
      )}

      {variant === "products" && (
        <div className={wrapClass(isExpanded)}>
          <AddProductDialog
            allProducts={allProducts}
            userId={userId}
            onOpenChange={handleDialogOpenChange}
          >
            <FabButton hue="rose" expanded={isExpanded} {...fabClickProps}>
              <Package className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Product</span>
            </FabButton>
          </AddProductDialog>
        </div>
      )}

      {variant === "home" && (
        <div className={wrapClass(isExpanded)}>
          <AddCategoryDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="sky" expanded={isExpanded} {...fabClickProps}>
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Category</span>
            </FabButton>
          </AddCategoryDialog>
        </div>
      )}

      {variant === "categories" && (
        <div className={wrapClass(isExpanded)}>
          <AddCategoryDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="sky" expanded={isExpanded} {...fabClickProps}>
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Category</span>
            </FabButton>
          </AddCategoryDialog>
        </div>
      )}

      {variant === "home" && (
        <div className={wrapClass(isExpanded)}>
          <AddSupplierDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="emerald" expanded={isExpanded} {...fabClickProps}>
              <Truck className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Supplier</span>
            </FabButton>
          </AddSupplierDialog>
        </div>
      )}

      {(variant === "home" || variant === "orders") && (
        <div className={wrapClass(isExpanded)}>
          <OrderDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="violet" expanded={isExpanded} {...fabClickProps}>
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Create Order</span>
            </FabButton>
          </OrderDialog>
        </div>
      )}

      {variant === "products-client" && (
        <div className={wrapClass(isExpanded)}>
          <OrderDialog
            defaultOwnerId={selectedOwnerId || undefined}
            onOpenChange={handleDialogOpenChange}
          >
            <FabButton
              hue="violet"
              expanded={isExpanded}
              disabled={!selectedOwnerId}
              {...fabClickProps}
            >
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Create Order</span>
            </FabButton>
          </OrderDialog>
        </div>
      )}

      {variant === "suppliers" && (
        <div className={wrapClass(isExpanded)}>
          <AddSupplierDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="emerald" expanded={isExpanded} {...fabClickProps}>
              <Truck className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Supplier</span>
            </FabButton>
          </AddSupplierDialog>
        </div>
      )}

      {variant === "warehouses" && (
        <div className={wrapClass(isExpanded)}>
          <WarehouseDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="amber" expanded={isExpanded} {...fabClickProps}>
              <Warehouse className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Add Warehouse</span>
            </FabButton>
          </WarehouseDialog>
        </div>
      )}

      {variant === "invoices" && (
        <div className={wrapClass(isExpanded)}>
          <InvoiceDialog onOpenChange={handleDialogOpenChange}>
            <FabButton hue="indigo" expanded={isExpanded} {...fabClickProps}>
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isExpanded)}>Generate Invoice</span>
            </FabButton>
          </InvoiceDialog>
        </div>
      )}
    </div>
  );
}
