/**
 * REQ-0119 — client-safe warehouse rollup for Business Insights tab.
 * Pure transforms over getWarehouseStockSummary rows (no DB).
 */

import type { WarehouseStockSummary } from "@/types/stock-allocation";

export type WarehouseRollupMetrics = {
  warehouseCount: number;
  warehousesWithStock: number;
  totalSkus: number;
  totalQuantity: number;
  totalReserved: number;
  totalValue: number;
  topWarehouse: { name: string; quantity: number; sharePct: number } | null;
  concentrationPct: number;
};

export type WarehouseQuantityChartRow = {
  name: string;
  quantity: number;
  value: number;
  reserved: number;
};

export type WarehouseSharePieRow = {
  name: string;
  value: number;
};

/** Aggregate KPIs for stat cards and AI summary. */
export function buildWarehouseRollupMetrics(
  rows: WarehouseStockSummary[],
): WarehouseRollupMetrics {
  if (!rows.length) {
    return {
      warehouseCount: 0,
      warehousesWithStock: 0,
      totalSkus: 0,
      totalQuantity: 0,
      totalReserved: 0,
      totalValue: 0,
      topWarehouse: null,
      concentrationPct: 0,
    };
  }

  const withStock = rows.filter((r) => r.totalQuantity > 0);
  const totalSkus = rows.reduce((sum, r) => sum + r.totalProducts, 0);
  const totalQuantity = rows.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalReserved = rows.reduce((sum, r) => sum + r.totalReserved, 0);
  const totalValue = rows.reduce((sum, r) => sum + r.totalValue, 0);

  const sorted = [...withStock].sort(
    (a, b) => b.totalQuantity - a.totalQuantity,
  );
  const top = sorted[0];
  const topShare =
    top && totalQuantity > 0
      ? Math.round((top.totalQuantity / totalQuantity) * 100)
      : 0;

  return {
    warehouseCount: rows.length,
    warehousesWithStock: withStock.length,
    totalSkus,
    totalQuantity,
    totalReserved,
    totalValue,
    topWarehouse: top
      ? {
          name: top.warehouseName,
          quantity: top.totalQuantity,
          sharePct: topShare,
        }
      : null,
    concentrationPct: topShare,
  };
}

/** Bar chart rows sorted by allocated quantity descending. */
export function buildWarehouseQuantityChartData(
  rows: WarehouseStockSummary[],
): WarehouseQuantityChartRow[] {
  return [...rows]
    .filter((r) => r.totalQuantity > 0)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .map((r) => ({
      name: r.warehouseName,
      quantity: r.totalQuantity,
      value: r.totalValue,
      reserved: r.totalReserved,
    }));
}

/** Pie slices for stock share by warehouse. */
export function buildWarehouseSharePieData(
  rows: WarehouseStockSummary[],
): WarehouseSharePieRow[] {
  return rows
    .filter((r) => r.totalQuantity > 0)
    .map((r) => ({
      name: r.warehouseName,
      value: r.totalQuantity,
    }));
}

/** One-line warehouse appendix for AI insights summary. */
export function formatWarehouseRollupForAi(
  metrics: WarehouseRollupMetrics,
  chartRows: WarehouseQuantityChartRow[],
): string {
  if (metrics.warehousesWithStock === 0) {
    return " Warehouse stock: no allocations yet.";
  }
  const top = chartRows
    .slice(0, 3)
    .map((r) => `${r.name} ${r.quantity} units`)
    .join("; ");
  const concentration =
    metrics.topWarehouse != null
      ? ` Top location ${metrics.topWarehouse.name} holds ${metrics.concentrationPct}% of allocated stock.`
      : "";
  return ` Warehouse rollup: ${metrics.warehousesWithStock} locations, ${metrics.totalQuantity} units, $${Math.round(metrics.totalValue).toLocaleString()} value. Top: ${top}.${concentration}`;
}
