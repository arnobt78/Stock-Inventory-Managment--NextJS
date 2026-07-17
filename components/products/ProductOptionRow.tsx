/**
 * REQ-0048 — inline product thumb + label for order Select (matches ProductTableColumns).
 * REQ-0059 — ProductThumb extracted for reuse on detail-page line items / allocation rows.
 */
import { Package } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
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
