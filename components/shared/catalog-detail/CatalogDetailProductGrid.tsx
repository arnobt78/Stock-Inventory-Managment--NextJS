/**
 * REQ-0086 — product grid for category/supplier detail pages (shared layout + responsive SKU row).
 */

import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";

import Link from "next/link";
import { Clock, DollarSign, Hash, Package, Truck, User } from "lucide-react";
import {
  AvatarInlineLink,
  CopyableText,
  DataSlotPulse,
} from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import type { CatalogDetailProductItem } from "@/types/catalog-detail-lists";
import { cn } from "@/lib/utils";

export type CatalogDetailProductGridProps = {
  products: CatalogDetailProductItem[];
  loading?: boolean;
  emptyMessage: string;
  productHref: (productId: string) => string;
  ownerProductsHref: (ownerId: string) => string;
  supplierHref: (supplierId: string) => string;
  className?: string;
};

export function CatalogDetailProductGrid({
  products,
  loading = false,
  emptyMessage,
  productHref,
  ownerProductsHref,
  supplierHref,
  className,
}: CatalogDetailProductGridProps) {
  if (loading) {
    return (
      <div className={cn("mt-4 space-y-2", className)}>
        <DataSlotPulse variant="text-md" />
        <DataSlotPulse variant="text-md" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className={cn(CARD_EMPTY_MESSAGE_CLASS, "mt-4", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4",
        className,
      )}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
        >
          <div className="flex items-start gap-2 min-w-0">
            <ProductThumb
              name={product.name}
              imageUrl={product.imageUrl}
              size="lg"
              className="rounded-xl shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={productHref(product.id)}
                className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
              >
                {product.name}
              </Link>
              {/* Single responsive row: SKU label + stock + price */}
              <p className="text-xs text-gray-600 dark:text-white/60 flex items-center gap-1.5 flex-wrap min-w-0">
                <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="shrink-0">SKU:</span>
                <CopyableText value={product.sku ?? ""}>
                  <span className="font-mono">{product.sku}</span>
                </CopyableText>
                <span className="text-gray-400">•</span>
                <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="shrink-0">Stock: {product.quantity ?? 0}</span>
                {(getDisplayCommittedQuantity(product) > 0) && (
                  <>
                    <span className="text-gray-400">•</span>
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{getDisplayCommittedQuantity(product)} reserved</span>
                  </>
                )}
                <span className="text-gray-400">•</span>
                <DollarSign className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>${(product.price ?? 0).toFixed(2)}</span>
              </p>
            </div>
          </div>
          {(product.owner || product.supplier) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-white/60">
              {product.owner && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Owner:{" "}
                  <AvatarInlineLink
                    seed={product.owner.id}
                    image={product.owner.image}
                    label={
                      product.owner.name ?? product.owner.email ?? "Owner"
                    }
                    href={ownerProductsHref(product.owner.id)}
                    size={20}
                  />
                </span>
              )}
              {product.supplier && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Supplier:{" "}
                  <AvatarInlineLink
                    seed={product.supplier.id}
                    label={product.supplier.name}
                    href={supplierHref(product.supplier.id)}
                    size={20}
                  />
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
