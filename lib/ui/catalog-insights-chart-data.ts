/**
 * REQ-0084 / REQ-0090 — chart data helpers for catalog entity insights (client-safe).
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

/** Product detail — warehouse available, reserved, and unallocated catalog qty. */
export function buildWarehouseAllocationStockChartData(
  insights: CatalogEntityInsights,
) {
  if (!insights.warehouseStock) return buildCatalogStockChartData(insights);
  const { available, reserved, unallocated } = insights.warehouseStock;
  return [
    { name: "Available", value: available },
    { name: "Reserved", value: reserved },
    ...(unallocated != null && unallocated > 0
      ? [{ name: "Unallocated", value: unallocated }]
      : []),
  ].filter((row) => row.value > 0);
}

/** Subtitle for product warehouse pie — reconciles catalog total vs warehouse rows. */
export function buildWarehouseStockChartDescription(
  insights: CatalogEntityInsights,
  catalogQuantity: number,
): string {
  const ws = insights.warehouseStock;
  if (!ws) {
    return "On-hand stock status";
  }

  const allocatedInWarehouses =
    ws.unallocated != null
      ? catalogQuantity - ws.unallocated
      : ws.available + ws.reserved;

  const parts: string[] = [`${allocatedInWarehouses} in warehouses`];

  if (ws.unallocated != null && ws.unallocated > 0) {
    parts.push(`${ws.unallocated} unallocated`);
  }

  parts.push(`${catalogQuantity} catalog total`);
  return parts.join(" · ");
}

export const CATALOG_STOCK_PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
export const WAREHOUSE_STOCK_PIE_COLORS = ["#10b981", "#6366f1", "#94a3b8"];
