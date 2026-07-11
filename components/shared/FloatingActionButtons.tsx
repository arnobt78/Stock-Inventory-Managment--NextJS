"use client";

import React, { useState } from "react";
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
  /** "home" = all FABs (Product, Category, Supplier, Order); "orders" = Create Order only; "products-client" = Create Order only (client, tied to product owner select) */
  variant?: FloatingActionButtonsVariant;
  allProducts?: Product[];
  userId?: string;
  /** For variant "products-client": product owner ID - button disabled when empty */
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
  const [isAnyHovered, setIsAnyHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsAnyHovered(true);
  };

  const handleMouseLeave = () => {
    setIsAnyHovered(false);
  };

  const labelClass = (expanded: boolean) =>
    `overflow-hidden whitespace-nowrap transition-all duration-300 ${
      expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
    }`;

  const wrapClass = (expanded: boolean) =>
    `relative flex justify-end transition-all duration-300 ${
      expanded ? "w-[160px]" : "w-14"
    }`;

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {variant === "home" && (
        <div className={wrapClass(isAnyHovered)}>
          <AddProductDialog allProducts={allProducts} userId={userId}>
            <FabButton hue="rose" expanded={isAnyHovered}>
              <Package className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Product</span>
            </FabButton>
          </AddProductDialog>
        </div>
      )}

      {variant === "products" && (
        <div className={wrapClass(isAnyHovered)}>
          <AddProductDialog allProducts={allProducts} userId={userId}>
            <FabButton hue="rose" expanded={isAnyHovered}>
              <Package className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Product</span>
            </FabButton>
          </AddProductDialog>
        </div>
      )}

      {variant === "home" && (
        <div className={wrapClass(isAnyHovered)}>
          <AddCategoryDialog>
            <FabButton hue="sky" expanded={isAnyHovered}>
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Category</span>
            </FabButton>
          </AddCategoryDialog>
        </div>
      )}

      {variant === "categories" && (
        <div className={wrapClass(isAnyHovered)}>
          <AddCategoryDialog>
            <FabButton hue="sky" expanded={isAnyHovered}>
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Category</span>
            </FabButton>
          </AddCategoryDialog>
        </div>
      )}

      {variant === "home" && (
        <div className={wrapClass(isAnyHovered)}>
          <AddSupplierDialog>
            <FabButton hue="emerald" expanded={isAnyHovered}>
              <Truck className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Supplier</span>
            </FabButton>
          </AddSupplierDialog>
        </div>
      )}

      {(variant === "home" || variant === "orders") && (
        <div className={wrapClass(isAnyHovered)}>
          <OrderDialog>
            <FabButton hue="violet" expanded={isAnyHovered}>
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Create Order</span>
            </FabButton>
          </OrderDialog>
        </div>
      )}

      {variant === "products-client" && (
        <div className={wrapClass(isAnyHovered)}>
          <OrderDialog defaultOwnerId={selectedOwnerId || undefined}>
            <FabButton
              hue="violet"
              expanded={isAnyHovered}
              disabled={!selectedOwnerId}
            >
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Create Order</span>
            </FabButton>
          </OrderDialog>
        </div>
      )}

      {variant === "suppliers" && (
        <div className={wrapClass(isAnyHovered)}>
          <AddSupplierDialog>
            <FabButton hue="emerald" expanded={isAnyHovered}>
              <Truck className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Supplier</span>
            </FabButton>
          </AddSupplierDialog>
        </div>
      )}

      {variant === "warehouses" && (
        <div className={wrapClass(isAnyHovered)}>
          <WarehouseDialog>
            <FabButton hue="amber" expanded={isAnyHovered}>
              <Warehouse className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Add Warehouse</span>
            </FabButton>
          </WarehouseDialog>
        </div>
      )}

      {variant === "invoices" && (
        <div className={wrapClass(isAnyHovered)}>
          <InvoiceDialog>
            <FabButton hue="indigo" expanded={isAnyHovered}>
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className={labelClass(isAnyHovered)}>Generate Invoice</span>
            </FabButton>
          </InvoiceDialog>
        </div>
      )}
    </div>
  );
}
