"use client";

/**
 * REQ-0101 — warehouse detail stock row: product thumb, catalog links, qty + row actions.
 * REQ-0203 gap — muted SKU; catalog meta left + edit/delete inline on same row.
 */

import type { ComponentType } from "react";
import Link from "next/link";
import { Pencil, Tag, Trash2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import { TABLE_CATALOG_LINK_CLASS } from "@/components/shared/dialog-edge-scroll";
import type { StockAllocation } from "@/types";
import { formatCatalogCommitWarehouseHint } from "@/lib/stock-allocation/catalog-allocation-copy";
import { cn } from "@/lib/utils";

const META_ROW_CLASS = "text-xs text-gray-600 dark:text-gray-300";
/** Match DialogProductOptionRow / product table SKU mute */
const SKU_MUTED_CLASS = "font-mono text-xs text-muted-foreground text-gray-500 dark:text-gray-400";

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
    <span
      className={cn("inline-flex min-w-0 items-center gap-1", META_ROW_CLASS)}
    >
      <Icon className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
      {label}{" "}
      <Link href={href} className={cn(TABLE_CATALOG_LINK_CLASS, "truncate")}>
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
  const catalogCommitted = product?.committedQuantity ?? 0;
  const catalogOnlyCommit =
    catalogCommitted > Number(allocation.reservedQuantity ?? 0);
  const commitHint = catalogOnlyCommit
    ? formatCatalogCommitWarehouseHint(catalogCommitted)
    : "";
  const sku = product?.sku?.trim();
  const showCatalogMeta =
    product?.quantity != null &&
    product?.allocatedTotal != null &&
    product?.unallocated != null;
  const showActions =
    !disableActions && !isArchived && Boolean(onEdit || onDelete);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-violet-200/30 bg-white/40 p-2 dark:border-violet-400/10 dark:bg-white/5",
        isArchived && "opacity-80",
        className,
      )}
    >
      {/* Top: product info | qty stack */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <ProductThumb name={name} imageUrl={product?.imageUrl} size="sm" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
              <Link
                href={productHref}
                className={cn(
                  TABLE_CATALOG_LINK_CLASS,
                  "text-sm",
                  isArchived && "text-gray-500 dark:text-gray-300",
                )}
              >
                {name}
              </Link>
              {sku ? (
                <>
                  <span
                    aria-hidden
                    className="text-xs text-gray-400 dark:text-white/60"
                  >
                    ·
                  </span>
                  <CopyableText value={sku} className="min-w-0">
                    <span className={SKU_MUTED_CLASS}>{sku}</span>
                  </CopyableText>
                </>
              ) : null}
              {isArchived ? (
                <Badge
                  variant="secondary"
                  className="shrink-0 text-xs font-normal"
                >
                  Archived
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {product?.categoryName && categoryHref ? (
                <MetaLink href={categoryHref} icon={Tag} label="Category:">
                  {product.categoryName}
                </MetaLink>
              ) : product?.categoryName ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    META_ROW_CLASS,
                  )}
                >
                  <Tag className="h-3 w-3 shrink-0" />
                  Category: {product.categoryName}
                </span>
              ) : null}
              {product?.supplierName && supplierHref && product.supplierId ? (
                <span
                  className={cn(
                    "inline-flex min-w-0 items-center gap-1",
                    META_ROW_CLASS,
                  )}
                >
                  <Truck className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300" />
                  <span className="shrink-0">Supplier:</span>
                  <AvatarInlineLink
                    label={product.supplierName}
                    seed={product.supplierId}
                    href={supplierHref}
                    size={18}
                    linkClassName={TABLE_CATALOG_LINK_CLASS}
                  />
                </span>
              ) : product?.supplierName ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    META_ROW_CLASS,
                  )}
                >
                  <Truck className="h-3 w-3 shrink-0" />
                  Supplier: {product.supplierName}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right sm:pl-2">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            {allocation.quantity}{" "}
            <span className="font-normal text-gray-500 dark:text-gray-300">
              total
            </span>
          </p>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {available}{" "}
            <span className="font-normal text-gray-500 dark:text-gray-300">
              available
            </span>
          </p>
          {allocation.reservedQuantity > 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {allocation.reservedQuantity} reserved
            </p>
          ) : null}
        </div>
      </div>

      {/* REQ-0203 gap — catalog meta left · edit/delete inline right */}
      {(showCatalogMeta || showActions || commitHint) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pl-0 sm:pl-10">
          <div className="min-w-0 flex-1 space-y-0.5">
            {showCatalogMeta ? (
              <p className="flex flex-wrap items-center gap-x-1 text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  {product!.quantity} Catalog
                </span>
                <span className="text-gray-400 dark:text-white/80">·</span>
                <span className="text-sky-600 dark:text-sky-400">
                  {product!.allocatedTotal} Allocated
                </span>
                <span className="text-gray-400 dark:text-white/80">·</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {product!.unallocated} Unallocated
                </span>
                {product!.committedQuantity != null &&
                product!.committedQuantity > 0 ? (
                  <>
                    <span className="text-gray-400 dark:text-white/80">·</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {product!.committedQuantity} Reserved
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
            {commitHint ? (
              <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
                {commitHint}
              </p>
            ) : null}
          </div>
          {showActions ? (
            <div className="flex shrink-0 flex-row items-center gap-0.5">
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
      )}
    </div>
  );
}
