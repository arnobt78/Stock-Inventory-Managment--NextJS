"use client";

/**
 * REQ-0063 — shared product line-item rows (thumb + name/SKU/qty/subtotal).
 * REQ-0147 — product name text-sm; meta Qty/SKU/catalog text-xs.
 * REQ-0148 — meta · separators + invoice CopyableText chip when order has invoice.
 * REQ-0163 — optional relatedOrder meta chip (invoice detail → ORD # + clipboard).
 */

import React from "react";
import Link from "next/link";
import { FileText, Hash, Package, Tag, Truck, Warehouse } from "lucide-react";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import { ProportionalPriceDisplay } from "@/components/shared/ProportionalPriceDisplay";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";
import type { Order, OrderItem } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";
import { orderHasFeeAdjustments } from "@/lib/orders/proportional-line-amount";
import { DETAIL_DATA_VALUE_CLASS } from "@/lib/ui/typography-scale";
import { cn } from "@/lib/utils";

export type ProductLineItemsListProps = {
  items: OrderItem[];
  linkMode: "admin" | "portal" | "none";
  warehouseLinkMode?: "admin" | "owner" | "none";
  orderSubtotal?: number;
  orderTotal?: number;
  emptyMessage?: string;
  showReviews?: boolean;
  /** REQ-0148 — include invoiceForOrder for meta invoice chip */
  order?: Pick<Order, "id" | "paymentStatus" | "invoiceForOrder">;
  /**
   * REQ-0163 — invoice detail: show linked order # chip (sky + clipboard).
   * Prefer over self invoiceForOrder on invoice pages.
   */
  relatedOrder?: { id: string; orderNumber: string } | null;
  initialReviewContext?: OrderReviewContext;
};

const META_LABEL =
  "inline-flex items-center gap-1 text-xs font-normal text-gray-600 dark:text-gray-300";

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
    <span className={META_LABEL}>
      <Icon className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
      {label}{" "}
      <Link
        href={href}
        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal"
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
    <span className={META_LABEL}>
      <Icon className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
      {label}{" "}
      <span className={cn("text-xs", DETAIL_DATA_VALUE_CLASS)}>{children}</span>
    </span>
  );
}

/** REQ-0148 — join meta chips with · separators (skip empty). */
function MetaSegmentRow({ segments }: { segments: React.ReactNode[] }) {
  const nodes = segments.filter(Boolean);
  if (nodes.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-2 border-t border-sky-200/30 dark:border-sky-400/10">
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <span className="text-gray-400 text-xs" aria-hidden>
              ·
            </span>
          ) : null}
          {node}
        </React.Fragment>
      ))}
    </div>
  );
}

export function ProductLineItemsList({
  items,
  linkMode,
  warehouseLinkMode = "none",
  orderSubtotal,
  orderTotal,
  emptyMessage = "No items",
  showReviews = false,
  order,
  relatedOrder = null,
  initialReviewContext,
}: ProductLineItemsListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  const invoice = order?.invoiceForOrder;
  const invoiceHref =
    invoice != null
      ? linkMode === "admin"
        ? `/admin/invoices/${invoice.id}`
        : linkMode !== "none"
          ? `/invoices/${invoice.id}`
          : null
      : null;

  const relatedOrderHref =
    relatedOrder != null
      ? linkMode === "admin"
        ? `/admin/orders/${relatedOrder.id}`
        : linkMode !== "none"
          ? `/orders/${relatedOrder.id}`
          : null
      : null;

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

        const showAdjusted =
          typeof item.proportionalAmount === "number" &&
          (orderSubtotal != null && orderTotal != null
            ? orderHasFeeAdjustments(orderSubtotal, orderTotal)
            : item.proportionalAmount !== item.subtotal);

        const metaSegments: React.ReactNode[] = [];

        if (item.categoryName || item.categoryId) {
          metaSegments.push(
            item.categoryId ? (
              <CatalogLink
                key="category"
                href={categoryHref}
                icon={Tag}
                label="Category:"
              >
                {item.categoryName ?? "View category"}
              </CatalogLink>
            ) : (
              <CatalogText key="category" icon={Tag} label="Category:">
                {item.categoryName ?? "—"}
              </CatalogText>
            ),
          );
        }

        if (item.supplierName || item.supplierId) {
          metaSegments.push(
            item.supplierId ? (
              <span key="supplier" className={META_LABEL}>
                <Truck className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
                Supplier:{" "}
                <AvatarInlineLink
                  seed={item.supplierId}
                  label={item.supplierName ?? "View supplier"}
                  href={supplierHref}
                  size={18}
                  linkClassName="text-xs"
                />
              </span>
            ) : (
              <CatalogText key="supplier" icon={Truck} label="Supplier:">
                {item.supplierName ?? "—"}
              </CatalogText>
            ),
          );
        }

        if (item.warehouseName) {
          metaSegments.push(
            warehouseHref ? (
              <CatalogLink
                key="warehouse"
                href={warehouseHref}
                icon={Warehouse}
                label="Warehouse:"
              >
                {item.warehouseName}
              </CatalogLink>
            ) : (
              <CatalogText key="warehouse" icon={Warehouse} label="Warehouse:">
                {item.warehouseName}
              </CatalogText>
            ),
          );
        }

        // REQ-0163 — linked order # on invoice detail (parity with invoice chip on order detail)
        if (relatedOrder?.orderNumber) {
          metaSegments.push(
            <span key="related-order" className={META_LABEL}>
              <FileText className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
              <CopyableText
                value={relatedOrder.orderNumber}
                className="min-w-0"
              >
                {relatedOrderHref ? (
                  <Link
                    href={relatedOrderHref}
                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal truncate"
                  >
                    {relatedOrder.orderNumber}
                  </Link>
                ) : (
                  <span className={cn("text-xs", DETAIL_DATA_VALUE_CLASS)}>
                    {relatedOrder.orderNumber}
                  </span>
                )}
              </CopyableText>
            </span>,
          );
        }

        // Invoice once per line row when order has a linked invoice (REQ-0148)
        if (invoice) {
          metaSegments.push(
            <span key="invoice" className={META_LABEL}>
              <FileText className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
              <CopyableText value={invoice.invoiceNumber} className="min-w-0">
                {invoiceHref ? (
                  <Link
                    href={invoiceHref}
                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal truncate"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                ) : (
                  <span className={cn("text-xs", DETAIL_DATA_VALUE_CLASS)}>
                    {invoice.invoiceNumber}
                  </span>
                )}
              </CopyableText>
            </span>,
          );
        }

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
                      className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-normal truncate",
                        DETAIL_DATA_VALUE_CLASS,
                      )}
                    >
                      {item.productName}
                    </span>
                  )}
                  <span className={cn(META_LABEL, "shrink-0")}>
                    <Hash className="h-3 w-3 shrink-0" />
                    SKU:{" "}
                    {item.sku ? (
                      <CopyableText value={item.sku}>
                        <span
                          className={cn(
                            "font-mono text-xs",
                            DETAIL_DATA_VALUE_CLASS,
                          )}
                        >
                          {item.sku}
                        </span>
                      </CopyableText>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <p
                  className={cn(
                    META_LABEL,
                    "flex flex-wrap gap-x-1.5 gap-y-0.5",
                  )}
                >
                  <Package className="h-3 w-3 shrink-0" />
                  <span>
                    Qty:{" "}
                    <span className={cn("text-xs", DETAIL_DATA_VALUE_CLASS)}>
                      {item.quantity}
                    </span>
                  </span>
                  <span className="text-gray-400" aria-hidden>
                    ·
                  </span>
                  <span className={cn("text-xs", DETAIL_DATA_VALUE_CLASS)}>
                    ${Number(item.price).toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="text-left sm:text-right flex flex-col items-end gap-2 shrink-0">
                <ProportionalPriceDisplay
                  listAmount={Number(item.subtotal)}
                  adjustedAmount={
                    showAdjusted ? Number(item.proportionalAmount) : undefined
                  }
                />
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

            <MetaSegmentRow segments={metaSegments} />
          </div>
        );
      })}
    </>
  );
}
