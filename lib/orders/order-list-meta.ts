/**
 * REQ-0145 — pure helpers for order list Order # column (product preview + item/unit counts).
 * Client-safe — no server imports.
 */

export type OrderListMetaItem = {
  productName?: string | null;
  quantity: number;
};

export type FormatOrderProductPreviewOptions = {
  /** Max product names to show before +N (default 2) */
  maxNames?: number;
  /** Max chars per name before ellipsis (default 28) */
  maxLen?: number;
};

/** Truncate a single product name for table preview. */
export function truncateOrderProductName(
  name: string,
  maxLen: number,
): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  if (maxLen <= 1) return "…";
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

/**
 * Compact product name line for order list rows.
 * e.g. "Beats Studio3 · Sony WH…" or "Beats Studio3 +1"
 */
export function formatOrderProductPreview(
  items: OrderListMetaItem[] | null | undefined,
  options: FormatOrderProductPreviewOptions = {},
): string | null {
  const maxNames = options.maxNames ?? 2;
  const maxLen = options.maxLen ?? 28;
  const names = (items ?? [])
    .map((i) => (i.productName ?? "").trim())
    .filter((n) => n.length > 0);
  if (names.length === 0) return null;

  const shown = names
    .slice(0, maxNames)
    .map((n) => truncateOrderProductName(n, maxLen));
  const rest = names.length - shown.length;
  if (rest > 0) {
    return `${shown.join(" · ")} +${rest}`;
  }
  return shown.join(" · ");
}

/** Item count + total units from order line items. */
export function getOrderItemUnitCounts(
  items: OrderListMetaItem[] | null | undefined,
): { itemCount: number; unitCount: number } {
  const list = items ?? [];
  const unitCount = list.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return { itemCount: list.length, unitCount };
}
