"use client";

import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";
import { GlassCard, variantConfig } from "./order-detail-primitives";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";

export type OrderItemsCardProps = {
  order?: Order;
  dataLoading: boolean;
  linkMode: "admin" | "none";
  /** REQ-0026 — batch SSR review context keyed by productId */
  initialReviewContext?: OrderReviewContext;
};

export function OrderItemsCard({
  order,
  dataLoading,
  linkMode,
  initialReviewContext,
}: OrderItemsCardProps) {
  const itemCount = order?.items?.length ?? 0;

  return (
    <GlassCard variant="sky">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "p-2 rounded-xl border",
            variantConfig.sky.iconBg,
            "dark:border-sky-400/30 dark:bg-sky-500/20",
          )}
        >
          <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
            Order Items
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {dataLoading ? (
              <DataSlotPulse variant="text-sm" className="w-28" />
            ) : (
              <>
                {itemCount} item{itemCount !== 1 ? "s" : ""} in this order
              </>
            )}
          </p>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {dataLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
            >
              <div className="flex-1 space-y-2">
                <DataSlotPulse variant="text-md" className="w-40" />
                <DataSlotPulse variant="text-sm" className="w-24" />
              </div>
              <DataSlotPulse variant="currency" />
            </div>
          ))
        ) : order?.items && order.items.length > 0 ? (
          order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
            >
              {/* REQ-0059: product thumbnail beside each line item (same look as products table) */}
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
                {order.paymentStatus === "paid" && item.productId && (
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
          ))
        ) : (
          <p className="text-muted-foreground">No items in this order</p>
        )}
      </div>
    </GlassCard>
  );
}
