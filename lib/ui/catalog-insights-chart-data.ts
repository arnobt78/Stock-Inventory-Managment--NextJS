/**
 * REQ-0084 — chart data helpers for catalog entity insights (client-safe).
 */

import type { CatalogEntityInsights } from "@/types/catalog-insights";

export function buildSalesChartData(insights: CatalogEntityInsights) {
  return insights.salesTrend.map((point) => ({
    label: point.month,
    revenue: Number(point.revenue.toFixed(2)),
    units: point.units,
  }));
}

/** Multi-product available / low / out pie slices. */
export function buildCatalogStockChartData(insights: CatalogEntityInsights) {
  return [
    { name: "Available", value: insights.stockBreakdown.available },
    { name: "Low stock", value: insights.stockBreakdown.low },
    { name: "Out of stock", value: insights.stockBreakdown.out },
  ].filter((row) => row.value > 0);
}

/** Product detail — warehouse available vs reserved when allocations exist. */
export function buildWarehouseAllocationStockChartData(
  insights: CatalogEntityInsights,
) {
  if (!insights.warehouseStock) return buildCatalogStockChartData(insights);
  const { available, reserved } = insights.warehouseStock;
  return [
    { name: "Available", value: available },
    { name: "Reserved", value: reserved },
  ].filter((row) => row.value > 0);
}

export const CATALOG_STOCK_PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
export const WAREHOUSE_STOCK_PIE_COLORS = ["#10b981", "#6366f1"];
