/**
 * REQ-0085 — warehouse KPIs, stock pie, and category mix from allocation rows (no DB).
 * Client-safe: imported by WarehouseDetailPage for live stock CRUD updates.
 */

import { CATALOG_LOW_STOCK_THRESHOLD } from "@/lib/insights/constants";
import { aggregateWarehouseStockFromAllocations } from "@/lib/insights/warehouse-stock-aggregate";
import type { WarehouseInsights, WarehouseStockSummary } from "@/types/warehouse-insights";
import type { StockAllocation } from "@/types";

/** Aggregate warehouse KPIs, stock pie, and category mix from enriched allocation rows. */
export function computeWarehouseInsights(
  allocations: StockAllocation[],
): WarehouseInsights {
  const productIds = new Set<string>();
  let totalUnits = 0;
  let availableUnits = 0;
  let reservedUnits = 0;
  let lowStockSkuCount = 0;
  const categoryCounts = new Map<string, number>();

  for (const row of allocations) {
    productIds.add(row.productId);
    const qty = Number(row.quantity ?? 0);
    const reserved = Number(row.reservedQuantity ?? 0);
    const available = Math.max(0, qty - reserved);
    totalUnits += qty;
    availableUnits += available;
    reservedUnits += reserved;

    if (available > 0 && available <= CATALOG_LOW_STOCK_THRESHOLD) {
      lowStockSkuCount += 1;
    }

    const categoryName = row.product?.categoryName?.trim() || "Uncategorized";
    categoryCounts.set(categoryName, (categoryCounts.get(categoryName) ?? 0) + 1);
  }

  const categoryMix = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const stockBreakdown = aggregateWarehouseStockFromAllocations(allocations) ?? {
    available: availableUnits,
    reserved: reservedUnits,
  };

  return {
    totalSkus: productIds.size,
    totalUnits,
    availableUnits,
    reservedUnits,
    lowStockSkuCount,
    stockBreakdown,
    categoryMix,
  };
}

/**
 * REQ-0115 — map insights KPIs to warehouse detail stat cards; null when no rows.
 */
export function mapWarehouseStockSummary(
  insights: WarehouseInsights,
  allocationRowCount: number,
): WarehouseStockSummary | null {
  if (allocationRowCount <= 0) return null;
  return {
    totalProducts: insights.totalSkus,
    totalQuantity: insights.totalUnits,
    availableQuantity: insights.availableUnits,
    reservedQuantity: insights.reservedUnits,
  };
}
