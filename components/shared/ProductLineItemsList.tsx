"use client";

/**
 * REQ-0063 — shared product line-item rows (thumb + name/SKU/qty/subtotal).
 * REQ-0073 — two-row thumb layout + inline category/supplier/warehouse row.
 */

import React from "react";
import Link from "next/link";
import { Hash, Package, Tag, Truck, Warehouse } from "lucide-react";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";
import type { Order, OrderItem } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";

export type ProductLineItemsListProps = {
  items: OrderItem[];
  linkMode: "admin" | "portal" | "none";
  /** REQ-0073 — warehouse link for admin/owner; plain text for client/supplier */
  warehouseLinkMode?: "admin" | "owner" | "none";
  emptyMessage?: string;
  showReviews?: boolean;
  order?: Pick<Order, "id" | "paymentStatus">;
  initialReviewContext?: OrderReviewContext;
};

function CatalogLink({
  href,
  icon: Icon,
  label,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
      {label}{" "}
      <Link
        href={href}
        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-medium"
      >
        {children}
      </Link>
    </span>
  );
}

function CatalogText({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
      {label} {children}
    </span>
  );
}

export function ProductLineItemsList({
  items,
  linkMode,
  warehouseLinkMode = "none",
  emptyMessage = "No items",
  showReviews = false,
  order,
  initialReviewContext,
}: ProductLineItemsListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      {items.map((item) => {
        const categoryHref =
          linkMode === "admin"
            ? `/admin/categories/${item.categoryId}`
            : `/categories/${item.categoryId}`;
        const supplierHref =
          linkMode === "admin"
            ? `/admin/suppliers/${item.supplierId}`
            : `/suppliers/${item.supplierId}`;
        const productHref =
          linkMode === "admin" && item.productId
            ? `/admin/products/${item.productId}`
            : linkMode === "portal" && item.productId
              ? `/products/${item.productId}`
              : null;

        const warehouseHref =
          item.warehouseId && warehouseLinkMode === "admin"
            ? `/admin/warehouses/${item.warehouseId}`
            : item.warehouseId && warehouseLinkMode === "owner"
              ? `/warehouses/${item.warehouseId}`
              : null;

        return (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
          >
            <div className="flex gap-3 items-start">
              <ProductThumb
                name={item.productName}
                imageUrl={item.imageUrl}
                size="lg"
                className="shrink-0 self-stretch min-h-[3rem]"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                  {productHref ? (
                    <Link
                      href={productHref}
                      className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-700 dark:text-white truncate">
                      {item.productName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 shrink-0">
                    <Hash className="h-3.5 w-3.5 shrink-0" />
                    SKU: {item.sku ?? "—"}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                </p>
              </div>
              <div className="text-left sm:text-right flex flex-col items-end gap-2 shrink-0">
                <p className="font-medium text-sky-600 dark:text-sky-400 text-sm sm:text-lg">
                  ${Number(item.subtotal).toFixed(2)}
                </p>
                {showReviews &&
                  order?.paymentStatus === "paid" &&
                  item.productId &&
                  order.id && (
                    <ProductReviewsSection
                      productId={item.productId}
                      productName={item.productName ?? "Product"}
                      orderId={order.id}
                      compact
                      variant="sky"
                      initialReviews={
                        initialReviewContext?.reviewsByProductId[item.productId]
                      }
                      initialEligibility={
                        initialReviewContext?.eligibilityByProductId[
                          item.productId
                        ]
                      }
                    />
                  )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-sky-200/30 dark:border-sky-400/10">
              {(item.categoryName || item.categoryId) &&
                (item.categoryId ? (
                  <CatalogLink href={categoryHref} icon={Tag} label="Category:">
                    {item.categoryName ?? "View category"}
                  </CatalogLink>
                ) : (
                  <CatalogText icon={Tag} label="Category:">
                    {item.categoryName ?? "—"}
                  </CatalogText>
                ))}
              {(item.supplierName || item.supplierId) &&
                (item.supplierId ? (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
                    Supplier:{" "}
                    <AvatarInlineLink
                      seed={item.supplierId}
                      label={item.supplierName ?? "View supplier"}
                      href={supplierHref}
                      size={20}
                    />
                  </span>
                ) : (
                  <CatalogText icon={Truck} label="Supplier:">
                    {item.supplierName ?? "—"}
                  </CatalogText>
                ))}
              {item.warehouseName &&
                (warehouseHref ? (
                  <CatalogLink href={warehouseHref} icon={Warehouse} label="Warehouse:">
                    {item.warehouseName}
                  </CatalogLink>
                ) : (
                  <CatalogText icon={Warehouse} label="Warehouse:">
                    {item.warehouseName}
                  </CatalogText>
                ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
