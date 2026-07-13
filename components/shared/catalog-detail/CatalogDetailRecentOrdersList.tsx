/**
 * REQ-0086 — recent orders list for category/supplier detail pages (shared layout + responsive meta row).
 */

"use client";

import Link from "next/link";
import { Calendar, Hash, Package, User } from "lucide-react";
import {
  AvatarInlineLink,
  ClientDate,
  CopyableText,
  DataSlotPulse,
  ListIndexBadge,
} from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { OrderStatusBadge } from "@/lib/ui/semantic-badges";
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
        return (
          <div
            key={order.id}
            className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 min-w-0">
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
                </div>
                {/* Single responsive row: product + SKU + qty/price + date */}
                <p className="text-sm text-gray-600 dark:text-white/60 flex items-center gap-1.5 flex-wrap min-w-0">
                  <ProductThumb
                    name={order.productName}
                    imageUrl={order.productImageUrl}
                    size="sm"
                    className="rounded-lg shrink-0"
                  />
                  <Link
                    href={productHref(order.productId)}
                    prefetch
                    className="font-normal text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                  >
                    {order.productName}
                  </Link>
                  {order.productSku && (
                    <>
                      <span className="text-gray-400">•</span>
                      <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="shrink-0 text-xs">SKU:</span>
                      <CopyableText value={order.productSku}>
                        <span className="font-mono text-xs">
                          {order.productSku}
                        </span>
                      </CopyableText>
                    </>
                  )}
                  <span className="text-gray-400">•</span>
                  <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>
                    Qty: {order.quantity} × ${order.price.toFixed(2)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <ClientDate date={order.orderDate} />
                </p>
                {(order.owner || order.placedBy) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-white/60">
                    {order.owner && (
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Owner:{" "}
                        <AvatarInlineLink
                          seed={order.owner.id}
                          image={order.owner.image}
                          label={
                            order.owner.name ??
                            order.owner.email ??
                            "Owner"
                          }
                          href={ownerProductsHref(order.owner.id)}
                          size={20}
                        />
                      </span>
                    )}
                    {order.placedBy && (
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Buyer:{" "}
                        {isAdminRole ? (
                          <AvatarInlineLink
                            seed={order.placedBy.id}
                            image={order.placedBy.image}
                            label={buyerLabel}
                            href={buyerAdminHref(order.placedBy.id)}
                            size={20}
                          />
                        ) : (
                          <AvatarInlineLink
                            seed={order.placedBy.id}
                            image={order.placedBy.image}
                            label={buyerLabel}
                            size={20}
                          />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="font-medium text-gray-700 dark:text-white">
                  {typeof order.proportionalAmount === "number" &&
                  order.proportionalAmount !== order.subtotal ? (
                    <>
                      <span className="text-gray-500 dark:text-white/50 line-through mr-2">
                        ${order.subtotal.toFixed(2)}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400">
                        ${order.proportionalAmount.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    `$${order.subtotal.toFixed(2)}`
                  )}
                </p>
                <OrderStatusBadge
                  status={order.orderStatus ?? "pending"}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
