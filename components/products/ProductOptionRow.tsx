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
} as const;

const thumbPx = { sm: 32, md: 40 } as const;

export type ProductThumbProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
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
      <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </span>
  );
}

export type ProductOptionRowProps = {
  name: string;
  imageUrl?: string | null;
  price?: number;
  quantity?: number;
  size?: "sm" | "md";
  /** When true, show price/stock meta on the right (dropdown list). */
  showMeta?: boolean;
  className?: string;
};

export function ProductOptionRow({
  name,
  imageUrl,
  price,
  quantity,
  size = "sm",
  showMeta = false,
  className,
}: ProductOptionRowProps) {
  return (
    <span
      className={cn("flex min-w-0 items-center gap-2", className)}
      title={name}
    >
      <ProductThumb name={name} imageUrl={imageUrl} size={size} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-left">{name}</span>
        {showMeta && price !== undefined && quantity !== undefined ? (
          <span className="truncate text-left text-xs text-muted-foreground dark:text-white/60">
            ${Number(price).toFixed(2)} · Stock: {quantity}
          </span>
        ) : null}
      </span>
    </span>
  );
}
