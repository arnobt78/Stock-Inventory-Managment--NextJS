/**
 * REQ-0085 / REQ-0090 — merge warehouse allocation totals into product catalog insights.
 * SSR: called in product detail page.tsx after parallel stock prefetch.
 * Client: re-runs when useStockByProduct updates after stock CRUD (no page refresh).
 */

import { aggregateWarehouseStockWithUnallocated } from "@/lib/insights/warehouse-stock-aggregate";
import type { CatalogEntityInsights } from "@/types/catalog-insights";
import type { StockAllocation } from "@/types";

/** Attach warehouseStock pie data when allocations exist; passthrough otherwise. */
export function enrichProductInsightsWithWarehouseStock(
  insights: CatalogEntityInsights,
  allocations: StockAllocation[] | null | undefined,
  catalogQuantity?: number,
): CatalogEntityInsights {
  const warehouseStock = aggregateWarehouseStockWithUnallocated(
    allocations ?? [],
    catalogQuantity,
  );
  if (!warehouseStock) return insights;
  return { ...insights, warehouseStock };
}
