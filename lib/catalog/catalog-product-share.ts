/**
 * REQ-0141 / REQ-0142 — pure share % for category/supplier Products column (client-safe).
 */

/** Hover copy for Products column header HelpTooltip. */
export const CATALOG_PRODUCT_SHARE_TOOLTIP =
  "Count of active products for this row. Percent is share of your catalog products.";

/** % of catalog for table display (0–100, rounded). */
export function catalogProductSharePercent(
  productCount: number,
  catalogTotal: number,
): number {
  if (catalogTotal <= 0 || productCount <= 0) return 0;
  return Math.min(100, Math.round((productCount / catalogTotal) * 100));
}
