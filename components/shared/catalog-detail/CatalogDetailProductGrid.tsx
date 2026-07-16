/**
 * REQ-0086 — product grid for category/supplier detail pages.
 * REQ-0141 — name · SKU on line 1; category link · stock · price on line 2.
 */

import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";

import Link from "next/link";
import { Clock, DollarSign, Hash, Package, Tag, Truck, User } from "lucide-react";
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
  /** When set, category name is a sky link (supplier detail / category detail). */
  categoryHref?: (categoryId: string) => string;
  className?: string;
};

export function CatalogDetailProductGrid({
  products,
  loading = false,
  emptyMessage,
  productHref,
  ownerProductsHref,
  supplierHref,
  categoryHref,
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
      {products.map((product) => {
        const category = product.category;
        const categoryNode =
          category != null && categoryHref != null ? (
            <Link
              href={categoryHref(category.id)}
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-500 min-w-0"
            >
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{category.name}</span>
            </Link>
          ) : category != null ? (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{category.name}</span>
            </span>
          ) : null;

        return (
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
                {/* Line 1: Name · SKU */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 text-xs text-gray-600 dark:text-white/60">
                  <Link
                    href={productHref(product.id)}
                    className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate max-w-full"
                  >
                    {product.name}
                  </Link>
                  {product.sku ? (
                    <>
                      <span className="text-gray-400" aria-hidden>
                        ·
                      </span>
                      <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <CopyableText value={product.sku}>
                        <span className="font-mono">{product.sku}</span>
                      </CopyableText>
                    </>
                  ) : null}
                </div>
                {/* Line 2: Category · Stock · reserved · price */}
                <p className="text-xs text-gray-600 dark:text-white/60 flex items-center gap-1.5 flex-wrap min-w-0">
                  {categoryNode}
                  {categoryNode != null ? (
                    <span className="text-gray-400" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="shrink-0">Stock: {product.quantity ?? 0}</span>
                  {getDisplayCommittedQuantity(product) > 0 ? (
                    <>
                      <span className="text-gray-400" aria-hidden>
                        ·
                      </span>
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>
                        {getDisplayCommittedQuantity(product)} reserved
                      </span>
                    </>
                  ) : null}
                  <span className="text-gray-400" aria-hidden>
                    ·
                  </span>
                  <DollarSign className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>${(product.price ?? 0).toFixed(2)}</span>
                </p>
              </div>
            </div>
            {(product.owner || product.supplier) && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-white/60">
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
                {/* REQ-0143 — middle-dot between Owner and Supplier */}
                {product.owner && product.supplier ? (
                  <span className="text-gray-400" aria-hidden>
                    ·
                  </span>
                ) : null}
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
        );
      })}
    </div>
  );
}
