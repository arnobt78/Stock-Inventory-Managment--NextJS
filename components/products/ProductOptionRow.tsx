/**
 * REQ-0048 — inline product thumb + label for order Select (matches ProductTableColumns).
 */
import { Package } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

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

const thumbSize = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
} as const;

export function ProductOptionRow({
  name,
  imageUrl,
  price,
  quantity,
  size = "sm",
  showMeta = false,
  className,
}: ProductOptionRowProps) {
  const dim = thumbSize[size];
  const unoptimized = Boolean(imageUrl?.includes("ik.imagekit.io"));

  return (
    <span
      className={cn("flex min-w-0 items-center gap-2", className)}
      title={name}
    >
      {imageUrl ? (
        <SafeImage
          src={imageUrl}
          alt={name}
          width={size === "md" ? 40 : 32}
          height={size === "md" ? 40 : 32}
          className={cn(dim, "shrink-0 rounded-lg border border-violet-400/30 object-cover")}
          unoptimized={unoptimized}
        />
      ) : (
        <span
          className={cn(
            dim,
            "flex shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-gray-200/80 dark:bg-gray-700/80",
          )}
          aria-hidden
        >
          <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </span>
      )}
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
