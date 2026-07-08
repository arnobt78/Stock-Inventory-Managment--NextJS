"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Add Product Button - home only */}
      {variant === "home" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <AddProductDialog allProducts={allProducts} userId={userId}>
            <Button
              className={`h-14 rounded-full border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 dark:from-rose-500/70 dark:via-rose-500/50 dark:to-rose-500/30 text-white shadow-[0_15px_35px_rgba(225,29,72,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-rose-300/40 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 hover:shadow-[0_20px_45px_rgba(225,29,72,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Package className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Product
              </span>
            </Button>
          </AddProductDialog>
        </div>
      )}

      {/* Add Product Button - products page only */}
      {variant === "products" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <AddProductDialog allProducts={allProducts} userId={userId}>
            <Button
              className={`h-14 rounded-full border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 dark:from-rose-500/70 dark:via-rose-500/50 dark:to-rose-500/30 text-white shadow-[0_15px_35px_rgba(225,29,72,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-rose-300/40 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 hover:shadow-[0_20px_45px_rgba(225,29,72,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Package className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Product
              </span>
            </Button>
          </AddProductDialog>
        </div>
      )}

      {/* Add Category Button - home only */}
      {variant === "home" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <AddCategoryDialog>
            <Button
              className={`h-14 rounded-full border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Category
              </span>
            </Button>
          </AddCategoryDialog>
        </div>
      )}

      {/* Add Category Button - categories page only */}
      {variant === "categories" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <AddCategoryDialog>
            <Button
              className={`h-14 rounded-full border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Category
              </span>
            </Button>
          </AddCategoryDialog>
        </div>
      )}

      {/* Add Supplier Button - home only */}
      {variant === "home" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <AddSupplierDialog>
            <Button
              className={`h-14 rounded-full border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-l from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 dark:from-emerald-500/70 dark:via-emerald-500/50 dark:to-emerald-500/30 text-white shadow-[0_15px_35px_rgba(16,185,129,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-emerald-300/40 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40 hover:shadow-[0_20px_45px_rgba(16,185,129,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Truck className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Supplier
              </span>
            </Button>
          </AddSupplierDialog>
        </div>
      )}

      {/* Create Order Button - home and orders */}
      {(variant === "home" || variant === "orders") && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <OrderDialog>
            <Button
              className={`h-14 rounded-full border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 text-white shadow-[0_15px_35px_rgba(139,92,246,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-violet-300/40 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 hover:shadow-[0_20px_45px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Create Order
              </span>
            </Button>
          </OrderDialog>
        </div>
      )}

      {/* Create Order Button - products page for client (depends on product owner select) */}
      {variant === "products-client" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <OrderDialog defaultOwnerId={selectedOwnerId || undefined}>
            <Button
              disabled={!selectedOwnerId}
              className={`h-14 rounded-full border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 text-white shadow-[0_15px_35px_rgba(139,92,246,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-violet-300/40 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 hover:shadow-[0_20px_45px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Create Order
              </span>
            </Button>
          </OrderDialog>
        </div>
      )}

      {/* Add Supplier Button - suppliers only */}
      {variant === "suppliers" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <AddSupplierDialog>
            <Button
              className={`h-14 rounded-full border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-l from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 dark:from-emerald-500/70 dark:via-emerald-500/50 dark:to-emerald-500/30 text-white shadow-[0_15px_35px_rgba(16,185,129,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-emerald-300/40 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40 hover:shadow-[0_20px_45px_rgba(16,185,129,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Truck className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Supplier
              </span>
            </Button>
          </AddSupplierDialog>
        </div>
      )}

      {/* Add Warehouse Button - warehouses only */}
      {variant === "warehouses" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <WarehouseDialog>
            <Button
              className={`h-14 rounded-full border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/70 via-amber-500/50 to-amber-500/30 dark:from-amber-500/70 dark:via-amber-500/50 dark:to-amber-500/30 text-white shadow-[0_15px_35px_rgba(245,158,11,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-amber-300/40 hover:from-amber-500/80 hover:via-amber-500/60 hover:to-amber-500/40 hover:shadow-[0_20px_45px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <Warehouse className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Add Warehouse
              </span>
            </Button>
          </WarehouseDialog>
        </div>
      )}

      {/* Generate Invoice Button - invoices only */}
      {variant === "invoices" && (
        <div
          className={`relative flex justify-end transition-all duration-300 ${
            isAnyHovered ? "w-[160px]" : "w-14"
          }`}
        >
          <InvoiceDialog>
            <Button
              className={`h-14 rounded-full border border-indigo-400/30 dark:border-indigo-400/30 bg-gradient-to-r from-indigo-500/70 via-indigo-500/50 to-indigo-500/30 dark:from-indigo-500/70 dark:via-indigo-500/50 dark:to-indigo-500/30 text-white shadow-[0_15px_35px_rgba(99,102,241,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-indigo-300/40 hover:from-indigo-500/80 hover:via-indigo-500/60 hover:to-indigo-500/40 hover:shadow-[0_20px_45px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2 ${
                isAnyHovered ? "w-auto px-4" : "w-14 px-0"
              }`}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isAnyHovered
                    ? "max-w-[120px] opacity-100"
                    : "max-w-0 opacity-0"
                }`}
              >
                Generate Invoice
              </span>
            </Button>
          </InvoiceDialog>
        </div>
      )}
    </div>
  );
}
