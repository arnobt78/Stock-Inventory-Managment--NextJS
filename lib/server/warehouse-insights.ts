/**
 * REQ-0084 — warehouse insights from enriched stock allocation rows (no extra DB).
 */

import { CATALOG_LOW_STOCK_THRESHOLD } from "@/lib/server/catalog-insights";
import type { WarehouseInsights } from "@/types/warehouse-insights";
import type { StockAllocation } from "@/types";

/** Aggregate warehouse KPIs, stock pie, and category mix from allocation SSR rows. */
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

  return {
    totalSkus: productIds.size,
    totalUnits,
    availableUnits,
    reservedUnits,
    lowStockSkuCount,
    stockBreakdown: { available: availableUnits, reserved: reservedUnits },
    categoryMix,
  };
}
