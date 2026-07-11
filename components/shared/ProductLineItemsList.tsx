"use client";

/**
 * REQ-0063 — shared product line-item rows (thumb + name/SKU/qty/subtotal).
 * Used by order detail (OrderItemsCard) and invoice detail (linked order items).
 */

import React from "react";
import Link from "next/link";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";
import type { Order, OrderItem } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";

export type ProductLineItemsListProps = {
  items: OrderItem[];
  linkMode: "admin" | "none";
  emptyMessage?: string;
  /** Order detail only — show review CTA when paid */
  showReviews?: boolean;
  order?: Pick<Order, "id" | "paymentStatus">;
  initialReviewContext?: OrderReviewContext;
};

export function ProductLineItemsList({
  items,
  linkMode,
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
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
        >
          <div className="flex flex-1 min-w-0 items-start gap-3">
            <ProductThumb
              name={item.productName}
              imageUrl={item.imageUrl}
              size="md"
            />
            <div className="flex-1 min-w-0">
              {linkMode === "admin" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium text-gray-700 dark:text-white">
                    {item.productId ? (
                      <Link
                        href={`/admin/products/${item.productId}`}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </h4>
                  {item.categoryId && (
                    <Link
                      href={`/admin/categories/${item.categoryId}`}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                    >
                      Category
                    </Link>
                  )}
                  {item.supplierId && (
                    <Link
                      href={`/admin/suppliers/${item.supplierId}`}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                    >
                      Supplier
                    </Link>
                  )}
                </div>
              ) : (
                <h4 className="font-medium text-gray-700 dark:text-white">
                  {item.productName}
                </h4>
              )}
              {item.sku && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SKU: {item.sku}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right mt-2 sm:mt-0 flex flex-col items-end gap-2">
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
                    initialReviewContext?.eligibilityByProductId[item.productId]
                  }
                />
              )}
          </div>
        </div>
      ))}
    </>
  );
}
