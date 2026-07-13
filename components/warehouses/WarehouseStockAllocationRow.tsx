"use client";

/**
 * REQ-0101 — warehouse detail stock row: product thumb, catalog links, qty + row actions.
 */

import type { ComponentType } from "react";
import Link from "next/link";
import { Hash, Pencil, Tag, Trash2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import type { StockAllocation } from "@/types";
import { formatCatalogAllocationSummary } from "@/lib/stock-allocation/catalog-allocation-copy";
import { cn } from "@/lib/utils";

/** Clickable catalog labels — text-xs font-normal (REQ-0101 warehouse stock row). */
const CATALOG_LINK_CLASS =
  "text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate";

const META_ROW_CLASS = "text-xs text-gray-600 dark:text-gray-400";

export type WarehouseStockAllocationRowProps = {
  allocation: StockAllocation;
  productHref: string;
  categoryHref?: string | null;
  supplierHref?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  disableActions?: boolean;
  className?: string;
};

function MetaLink({
  href,
  icon: Icon,
  label,
  children,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", META_ROW_CLASS)}>
      <Icon className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400" />
      {label}{" "}
      <Link href={href} className={CATALOG_LINK_CLASS}>
        {children}
      </Link>
    </span>
  );
}

export function WarehouseStockAllocationRow({
  allocation,
  productHref,
  categoryHref,
  supplierHref,
  onEdit,
  onDelete,
  disableActions = false,
  className,
}: WarehouseStockAllocationRowProps) {
  const product = allocation.product;
  const available = allocation.quantity - allocation.reservedQuantity;
  const name = product?.name ?? "Unknown Product";
  const isArchived = product?.isArchived === true;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-violet-200/30 bg-white/40 p-2 dark:border-violet-400/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between",
        isArchived && "opacity-80",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <ProductThumb name={name} imageUrl={product?.imageUrl} size="sm" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            <Link
              href={productHref}
              className={cn(
                CATALOG_LINK_CLASS,
                isArchived && "text-gray-500 dark:text-gray-400",
              )}
            >
              {name}
            </Link>
            {isArchived ? (
              <Badge
                variant="secondary"
                className="shrink-0 text-xs font-normal"
              >
                Archived
              </Badge>
            ) : null}
            {product?.sku ? (
              <span
                className={cn(
                  "inline-flex min-w-0 items-center gap-1 shrink-0",
                  META_ROW_CLASS,
                )}
              >
                <Hash className="h-3 w-3 shrink-0" aria-hidden />
                <span className="shrink-0">SKU:</span>
                <CopyableText value={product.sku}>
                  <span className="font-mono">{product.sku}</span>
                </CopyableText>
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {product?.categoryName && categoryHref ? (
              <MetaLink href={categoryHref} icon={Tag} label="Category:">
                {product.categoryName}
              </MetaLink>
            ) : product?.categoryName ? (
              <span className={cn("inline-flex items-center gap-1", META_ROW_CLASS)}>
                <Tag className="h-3 w-3 shrink-0" />
                {product.categoryName}
              </span>
            ) : null}
            {product?.supplierName && supplierHref && product.supplierId ? (
              <span
                className={cn(
                  "inline-flex min-w-0 items-center gap-1",
                  META_ROW_CLASS,
                )}
              >
                <Truck className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="shrink-0">Supplier:</span>
                <AvatarInlineLink
                  label={product.supplierName}
                  seed={product.supplierId}
                  href={supplierHref}
                  size={18}
                  linkClassName="text-xs font-normal text-sky-600 dark:text-sky-400"
                />
              </span>
            ) : product?.supplierName ? (
              <span className={cn("inline-flex items-center gap-1", META_ROW_CLASS)}>
                <Truck className="h-3 w-3 shrink-0" />
                {product.supplierName}
              </span>
            ) : null}
            {product?.quantity != null &&
            product?.allocatedTotal != null &&
            product?.unallocated != null ? (
              <span className={META_ROW_CLASS}>
                {formatCatalogAllocationSummary(
                  product.quantity,
                  product.allocatedTotal,
                  product.unallocated,
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 sm:items-center sm:justify-end">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            {allocation.quantity}{" "}
            <span className="font-normal text-gray-500 dark:text-gray-400">
              total
            </span>
          </p>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {available}{" "}
            <span className="font-normal text-gray-500 dark:text-gray-400">
              available
            </span>
          </p>
          {allocation.reservedQuantity > 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {allocation.reservedQuantity} reserved
            </p>
          ) : null}
        </div>
        {!disableActions && !isArchived && (onEdit || onDelete) ? (
          <div className="flex items-center gap-1">
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-violet-600 dark:text-violet-400"
                aria-label={`Edit allocation for ${name}`}
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-rose-600 dark:text-rose-400"
                aria-label={`Remove allocation for ${name}`}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
