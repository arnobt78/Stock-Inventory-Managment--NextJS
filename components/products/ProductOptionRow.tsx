/**
 * REQ-0048 — inline product thumb + label for order Select (matches ProductTableColumns).
 * REQ-0059 — ProductThumb extracted for reuse on detail-page line items / allocation rows.
 * REQ-0179 — DialogProductOptionRow for Select densify (no Links inside SelectItem).
 */
import { Package, Tag } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { cn } from "@/lib/utils";

const thumbSize = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

const thumbPx = { sm: 32, md: 40, lg: 48 } as const;

export type ProductThumbProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Product thumbnail with Package-icon fallback — same treatment as the
 * products table image cell. Reusable on order/invoice detail line items,
 * warehouse allocations, and catalog detail product lists.
 */
export function ProductThumb({
  name,
  imageUrl,
  size = "sm",
  className,
}: ProductThumbProps) {
  const dim = thumbSize[size];
  const unoptimized = Boolean(imageUrl?.includes("ik.imagekit.io"));

  return imageUrl ? (
    <SafeImage
      src={imageUrl}
      alt={name}
      width={thumbPx[size]}
      height={thumbPx[size]}
      className={cn(
        dim,
        "shrink-0 rounded-lg border border-violet-400/30 object-cover",
        className,
      )}
      unoptimized={unoptimized}
    />
  ) : (
    <span
      className={cn(
        dim,
        "flex shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-gray-200/80 dark:bg-gray-700/80",
        className,
      )}
      aria-hidden
    >
      <Package className="h-4 w-4 text-gray-500 dark:text-gray-300" />
    </span>
  );
}

export type ProductOptionRowProps = {
  name: string;
  imageUrl?: string | null;
  price?: number;
  quantity?: number;
  /** Warehouse-available qty (transfer picker) — overrides quantity label when set */
  availableQuantity?: number;
  categoryName?: string | null;
  supplierName?: string | null;
  size?: "sm" | "md";
  /** When true, show price/stock meta on the right (dropdown list). */
  showMeta?: boolean;
  /** Dark glass dialog trigger only — popover list items use default readable meta. */
  metaOnDark?: boolean;
  className?: string;
};

/** Readable meta on light popover surfaces (allocate/transfer product picker). */
const PRODUCT_OPTION_META_POPOVER_CLASS = "text-gray-600 dark:text-gray-300";

function formatCatalogMeta(props: ProductOptionRowProps): string | null {
  const parts: string[] = [];
  if (props.categoryName) parts.push(props.categoryName);
  if (props.supplierName) parts.push(props.supplierName);
  if (props.price !== undefined)
    parts.push(`$${Number(props.price).toFixed(2)}`);
  const stock =
    props.availableQuantity !== undefined
      ? props.availableQuantity
      : props.quantity;
  if (stock !== undefined) parts.push(`Stock: ${stock}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function ProductOptionRow({
  name,
  imageUrl,
  price,
  quantity,
  availableQuantity,
  categoryName,
  supplierName,
  size = "sm",
  showMeta = false,
  metaOnDark = false,
  className,
}: ProductOptionRowProps) {
  const meta = showMeta
    ? formatCatalogMeta({
        name,
        price,
        quantity,
        availableQuantity,
        categoryName,
        supplierName,
      })
    : null;

  return (
    <span
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
      title={name}
    >
      <ProductThumb name={name} imageUrl={imageUrl} size={size} />
      <span className="flex min-w-0 flex-1 flex-col  text-left">
        <span className="truncate">{name}</span>
        {meta ? (
          <span
            className={cn(
              "truncate text-xs",
              metaOnDark ? "text-white/85" : PRODUCT_OPTION_META_POPOVER_CLASS,
            )}
          >
            {meta}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** Resolve category/supplier display name from Product API shape. */
export function productCategoryLabel(
  category: string | { id: string; name: string } | null | undefined,
): string | null {
  if (!category) return null;
  return typeof category === "string" ? category : category.name;
}

export function productSupplierLabel(
  supplier: string | { id: string; name: string } | null | undefined,
): string | null {
  if (!supplier) return null;
  return typeof supplier === "string" ? supplier : supplier.name;
}

export type DialogProductOptionRowProps = {
  name: string;
  imageUrl?: string | null;
  sku?: string | null;
  categoryName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerImage?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierImage?: string | null;
  /** Dark amber/glass Select trigger */
  metaOnDark?: boolean;
  className?: string;
};

/**
 * REQ-0179 — Select-safe densify row (no Link / CopyableText):
 * thumb · name text-sm · sku muted xs
 * Tag category · owner avatar · supplier avatar
 */
export function DialogProductOptionRow({
  name,
  imageUrl,
  sku,
  categoryName,
  ownerId,
  ownerName,
  ownerImage,
  supplierId,
  supplierName,
  supplierImage,
  metaOnDark = false,
  className,
}: DialogProductOptionRowProps) {
  const skuText = (sku ?? "").trim();
  const cat = (categoryName ?? "").trim();
  const ownerLabel = (ownerName ?? "").trim();
  const supplierLabel = (supplierName ?? "").trim();
  const mutedClass = metaOnDark
    ? "text-white/70"
    : "text-gray-500 dark:text-gray-400";
  const nameClass = metaOnDark
    ? "text-sm font-normal text-white/90"
    : "text-sm font-normal text-gray-800 dark:text-gray-100";
  const metaRowClass = metaOnDark
    ? "text-xs text-white/80"
    : "text-xs text-gray-600 dark:text-gray-300";

  return (
    <span
      className={cn("flex min-w-0 flex-1 items-start gap-2 py-0.5", className)}
      title={name}
    >
      <ProductThumb name={name} imageUrl={imageUrl} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
          <span className={cn("truncate", nameClass)}>{name}</span>
          {skuText ? (
            <>
              <span aria-hidden className={mutedClass}>
                ·
              </span>
              <span className={cn("font-mono truncate", mutedClass, "text-xs")}>
                {skuText}
              </span>
            </>
          ) : null}
        </span>
        {(cat || ownerLabel || supplierLabel) && (
          <span
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
                linkClassName={cn("text-xs", metaOnDark && "text-white/85")}
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
                linkClassName={cn("text-xs", metaOnDark && "text-white/85")}
                className="gap-1"
              />
            ) : supplierLabel ? (
              <span className="truncate">{supplierLabel}</span>
            ) : null}
          </span>
        )}
      </span>
    </span>
  );
}
