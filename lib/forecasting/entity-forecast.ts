/**
 * REQ-0084 — client-safe forecast helpers for detail pages.
 */

import type { ProductDemandForecast } from "@/types";

/** Pick single-product forecast row for product detail admin KPIs. */
export function findProductForecast(
  forecasts: ProductDemandForecast[],
  productId: string,
): ProductDemandForecast | null {
  return forecasts.find((f) => f.productId === productId) ?? null;
}
