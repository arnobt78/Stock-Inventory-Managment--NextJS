"use client";

/**
 * REQ-0201 — Interactive Related product densify for ticket detail.
 * Same layout as DialogProductOptionRow + sky Link name + CopyableText SKU.
 */

import Link from "next/link";
import { Boxes, DollarSign, Tag } from "lucide-react";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { cn } from "@/lib/utils";

export type TicketRelatedProductDenseProps = {
  productId: string;
  productHref: string;
  name: string;
  sku?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  quantity?: number | null;
  categoryName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerImage?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierImage?: string | null;
  className?: string;
};

export function TicketRelatedProductDense({
  productId,
  productHref,
  name,
  sku,
  imageUrl,
  price,
  quantity,
  categoryName,
  ownerId,
  ownerName,
  ownerImage,
  supplierId,
  supplierName,
  supplierImage,
  className,
}: TicketRelatedProductDenseProps) {
  const skuText = (sku ?? "").trim();
  const cat = (categoryName ?? "").trim();
  const ownerLabel = (ownerName ?? "").trim();
  const supplierLabel = (supplierName ?? "").trim();
  const showPrice = price != null && Number.isFinite(price);
  const showStock = quantity != null && Number.isFinite(quantity);
  const mutedClass = "text-gray-500 dark:text-gray-400";
  const metaRowClass = "text-xs text-gray-600 dark:text-gray-300";

  return (
    <div
      data-product-id={productId}
      className={cn("flex min-w-0 flex-1 items-start gap-2 py-0.5", className)}
    >
      <ProductThumb name={name} imageUrl={imageUrl} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
          <Link
            href={productHref}
            prefetch
            className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate max-w-full"
          >
            {name}
          </Link>
          {skuText ? (
            <>
              <span aria-hidden className={mutedClass}>
                ·
              </span>
              <CopyableText
                value={skuText}
                className={cn("font-mono text-xs", mutedClass)}
              >
                <span className="truncate">{skuText}</span>
              </CopyableText>
            </>
          ) : null}
          {showPrice ? (
            <>
              <span aria-hidden className={mutedClass}>
                ·
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 shrink-0 text-xs",
                  mutedClass,
                )}
              >
                <DollarSign className="h-3 w-3 shrink-0" aria-hidden />
                {Number(price).toFixed(2)}
              </span>
            </>
          ) : null}
          {showStock ? (
            <>
              <span aria-hidden className={mutedClass}>
                ·
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 shrink-0 text-xs",
                  mutedClass,
                )}
              >
                <Boxes className="h-3 w-3 shrink-0" aria-hidden />
                {Number(quantity)}
              </span>
            </>
          ) : null}
        </div>
        {(cat || ownerLabel || supplierLabel) && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0",
              metaRowClass,
            )}
          >
            {cat ? (
              <span className="inline-flex items-center gap-1 min-w-0">
                <Tag className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{cat}</span>
              </span>
            ) : null}
            {cat && (ownerLabel || supplierLabel) ? (
              <span aria-hidden className={mutedClass}>
                ·
              </span>
            ) : null}
            {ownerId && ownerLabel ? (
              <AvatarInlineLink
                seed={ownerId}
                image={ownerImage}
                label={ownerLabel}
                size={18}
                linkClassName="text-xs"
                className="gap-1"
              />
            ) : ownerLabel ? (
              <span className="truncate">{ownerLabel}</span>
            ) : null}
            {(ownerLabel || ownerId) && supplierLabel ? (
              <span aria-hidden className={mutedClass}>
                ·
              </span>
            ) : null}
            {supplierId && supplierLabel ? (
              <AvatarInlineLink
                seed={supplierId}
                image={supplierImage}
                label={supplierLabel}
                size={18}
                linkClassName="text-xs"
                className="gap-1"
              />
            ) : supplierLabel ? (
              <span className="truncate">{supplierLabel}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
