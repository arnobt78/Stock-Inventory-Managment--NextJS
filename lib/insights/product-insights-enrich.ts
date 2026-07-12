/**
 * REQ-0085 — merge warehouse allocation totals into product catalog insights.
 * SSR: called in product detail page.tsx after parallel stock prefetch.
 * Client: re-runs when useStockByProduct updates after stock CRUD (no page refresh).
 */

import { aggregateWarehouseStockFromAllocations } from "@/lib/insights/warehouse-stock-aggregate";
import type { CatalogEntityInsights } from "@/types/catalog-insights";
import type { StockAllocation } from "@/types";

/** Attach warehouseStock pie data when allocations exist; passthrough otherwise. */
export function enrichProductInsightsWithWarehouseStock(
  insights: CatalogEntityInsights,
  allocations: StockAllocation[] | null | undefined,
): CatalogEntityInsights {
  const warehouseStock = aggregateWarehouseStockFromAllocations(
    allocations ?? [],
  );
  if (!warehouseStock) return insights;
  return { ...insights, warehouseStock };
}
