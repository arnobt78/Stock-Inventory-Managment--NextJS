"use client";

/**
 * REQ-0086 — recent orders list for category/supplier/product detail pages.
 * REQ-0127 — status below price; statusAt on terminal orders; hideProductMeta for product detail.
 * REQ-0143 — category sky link; invoice indicator; Owner · Buyer separators.
 */

import Link from "next/link";
import { Calendar, FileText, Hash, Package, Tag, User } from "lucide-react";
import {
  AvatarInlineLink,
  ClientDate,
  CopyableText,
  DataSlotPulse,
  ListIndexBadge,
  ProportionalPriceDisplay,
  RecentOrderStatusColumn,
} from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import type { CatalogDetailRecentOrderItem } from "@/types/catalog-detail-lists";
import { cn } from "@/lib/utils";

export type CatalogDetailRecentOrdersListProps = {
  orders: CatalogDetailRecentOrderItem[];
  loading?: boolean;
  emptyMessage: string;
  orderHref: (orderId: string) => string;
  productHref: (productId: string) => string;
  ownerProductsHref: (ownerId: string) => string;
  isAdminRole?: boolean;
  buyerAdminHref?: (userId: string) => string;
  /** When set, category name is a sky link on the product meta line */
  categoryHref?: (categoryId: string) => string;
  /** When set, invoice number links to invoice detail */
  invoiceHref?: (invoiceId: string) => string;
  /** Product detail — omit thumb/name/SKU row (single-product context) */
  hideProductMeta?: boolean;
  className?: string;
};

export function CatalogDetailRecentOrdersList({
  orders,
  loading = false,
  emptyMessage,
  orderHref,
  productHref,
  ownerProductsHref,
  isAdminRole = false,
  buyerAdminHref = (userId) => `/admin/user-management/${userId}`,
  categoryHref,
  invoiceHref,
  hideProductMeta = false,
  className,
}: CatalogDetailRecentOrdersListProps) {
  if (loading) {
    return (
      <div className={cn("mt-4 space-y-2", className)}>
        <DataSlotPulse variant="text-md" />
        <DataSlotPulse variant="text-md" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className={cn(CARD_EMPTY_MESSAGE_CLASS, "mt-4", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2 mt-4", className)}>
      {orders.map((order, index) => {
        const buyerLabel =
          order.placedBy?.name?.trim() ||
          order.placedBy?.email ||
          "Unknown buyer";
        const category = order.category;
        const categoryNode =
          category != null && categoryHref != null ? (
            <Link
              href={categoryHref(category.id)}
              prefetch
              className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 min-w-0"
            >
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{category.name}</span>
            </Link>
          ) : category != null ? (
            <span className="inline-flex items-center gap-1 text-xs min-w-0">
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{category.name}</span>
            </span>
          ) : null;

        const invoice = order.invoiceForOrder;
        const invoiceNode =
          invoice != null && invoiceHref != null ? (
            <>
              <span className="text-gray-400" aria-hidden>
                ·
              </span>
              <FileText
                className="h-3.5 w-3.5 shrink-0 text-gray-500"
                aria-hidden
              />
              <CopyableText
                value={invoice.invoiceNumber}
                className="min-w-0 text-xs"
              >
                <Link
                  href={invoiceHref(invoice.id)}
                  prefetch
                  className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                >
                  {invoice.invoiceNumber}
                </Link>
              </CopyableText>
            </>
          ) : invoice != null ? (
            <>
              <span className="text-gray-400" aria-hidden>
                ·
              </span>
              <FileText
                className="h-3.5 w-3.5 shrink-0 text-gray-500"
                aria-hidden
              />
              <CopyableText
                value={invoice.invoiceNumber}
                className="min-w-0 text-xs"
              >
                <span className="font-normal text-xs truncate">
                  {invoice.invoiceNumber}
                </span>
              </CopyableText>
            </>
          ) : null;

        return (
          <div
            key={order.id}
            className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <ListIndexBadge index={index + 1} />
                  <CopyableText value={order.orderNumber} className="min-w-0">
                    <Link
                      href={orderHref(order.orderId)}
                      prefetch
                      className="font-normal text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                    >
                      {order.orderNumber}
                    </Link>
                  </CopyableText>
                  {/* REQ-0143 — invoice indicator beside order number */}
                  {invoiceNode}
                </div>
                {!hideProductMeta ? (
                  <p className="text-xs font-normal text-gray-600 dark:text-white/80 flex items-center gap-1.5 flex-wrap min-w-0">
                    <ProductThumb
                      name={order.productName}
                      imageUrl={order.productImageUrl}
                      size="sm"
                      className="rounded-lg shrink-0"
                    />
                    <Link
                      href={productHref(order.productId)}
                      prefetch
                      className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                    >
                      {order.productName}
                    </Link>
                    {order.productSku && (
                      <>
                        <span className="text-gray-400" aria-hidden>
                          ·
                        </span>
                        <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="shrink-0 text-xs">SKU:</span>
                        <CopyableText value={order.productSku}>
                          <span className="font-mono text-xs">
                            {order.productSku}
                          </span>
                        </CopyableText>
                      </>
                    )}
                    {categoryNode != null ? (
                      <>
                        <span className="text-gray-400" aria-hidden>
                          ·
                        </span>
                        {categoryNode}
                      </>
                    ) : null}
                    <span className="text-gray-400" aria-hidden>
                      ·
                    </span>
                    <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      Qty:{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {order.quantity}
                      </span>{" "}
                      × ${order.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400" aria-hidden>
                      ·
                    </span>
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <ClientDate date={order.orderDate} semantic="created" />
                  </p>
                ) : (
                  <p className="text-xs font-normal text-gray-600 dark:text-gray-300 flex items-center gap-1.5 flex-wrap min-w-0">
                    {categoryNode != null ? (
                      <>
                        {categoryNode}
                        <span className="text-gray-400" aria-hidden>
                          ·
                        </span>
                      </>
                    ) : null}
                    <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      Qty:{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {order.quantity}
                      </span>{" "}
                      × ${order.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400" aria-hidden>
                      ·
                    </span>
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <ClientDate date={order.orderDate} semantic="created" />
                  </p>
                )}
                {(order.owner || order.placedBy) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-normal text-gray-600 dark:text-gray-300">
                    {order.owner && (
                      <span className="inline-flex items-center gap-1.5 min-w-0 font-normal">
                        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Owner:{" "}
                        <AvatarInlineLink
                          seed={order.owner.id}
                          image={order.owner.image}
                          label={
                            order.owner.name ?? order.owner.email ?? "Owner"
                          }
                          href={ownerProductsHref(order.owner.id)}
                          size={20}
                          linkClassName="text-xs"
                        />
                      </span>
                    )}
                    {order.owner && order.placedBy ? (
                      <span className="text-gray-400" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    {order.placedBy && (
                      <span className="inline-flex items-center gap-1.5 min-w-0 font-normal">
                        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Buyer:{" "}
                        {isAdminRole ? (
                          <AvatarInlineLink
                            seed={order.placedBy.id}
                            image={order.placedBy.image}
                            label={buyerLabel}
                            href={buyerAdminHref(order.placedBy.id)}
                            size={20}
                            linkClassName="text-xs"
                          />
                        ) : (
                          <AvatarInlineLink
                            seed={order.placedBy.id}
                            image={order.placedBy.image}
                            label={buyerLabel}
                            size={20}
                            linkClassName="text-xs"
                          />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <RecentOrderStatusColumn
                status={order.orderStatus ?? "pending"}
                statusAt={order.statusAt}
                paymentStatus={order.paymentStatus}
                trailing={
                  <ProportionalPriceDisplay
                    listAmount={order.subtotal}
                    adjustedAmount={order.proportionalAmount}
                    size="sm"
                  />
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
