"use client";

/**
 * REQ-0173 — denser admin catalog product cell (forecast + Top Products).
 *   [thumb] Name · SKU[copy]
 *           Tag Category · AvatarInlineLink supplier (circle ring)
 */

import Link from "next/link";
import { Tag } from "lucide-react";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import { ProductThumb } from "@/components/products/ProductOptionRow";

export type DenseCatalogProductCellProps = {
  productId: string;
  productName: string;
  sku: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierImage?: string | null;
};

export function DenseCatalogProductCell({
  productId,
  productName,
  sku,
  imageUrl,
  categoryId,
  categoryName,
  supplierId,
  supplierName,
  supplierImage,
}: DenseCatalogProductCellProps) {
  const skuText = (sku ?? "").trim();
  const hasSku = skuText.length > 0;
  const hasCategory = Boolean(categoryId && categoryName);
  const hasSupplier = Boolean(supplierId && supplierName);

  return (
    <div className="flex items-start gap-2 min-w-0">
      <ProductThumb
        name={productName}
        imageUrl={imageUrl}
        size="sm"
        className="rounded-lg shrink-0"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
          <Link
            href={`/admin/products/${productId}`}
            prefetch
            className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate max-w-full"
          >
            {productName}
          </Link>
          {hasSku ? (
            <>
              <span aria-hidden className="text-gray-400 dark:text-gray-500">
                ·
              </span>
              <CopyableText
                value={skuText}
                className="font-mono text-xs text-gray-500 dark:text-gray-300"
              >
                <span className="truncate">{skuText}</span>
              </CopyableText>
            </>
          ) : null}
        </div>
        {(hasCategory || hasSupplier) && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 text-xs">
            {hasCategory ? (
              <Link
                href={`/admin/categories/${categoryId}`}
                prefetch
                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 min-w-0"
              >
                <Tag className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{categoryName}</span>
              </Link>
            ) : null}
            {hasCategory && hasSupplier ? (
              <span aria-hidden className="text-gray-400 dark:text-gray-500">
                ·
              </span>
            ) : null}
            {hasSupplier ? (
              <AvatarInlineLink
                seed={supplierId!}
                image={supplierImage}
                label={supplierName!}
                href={`/admin/suppliers/${supplierId}`}
                size={20}
                linkClassName="text-xs font-normal"
                className="gap-1.5"
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
