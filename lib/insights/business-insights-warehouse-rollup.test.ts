import { describe, expect, it } from "vitest";
import type { WarehouseStockSummary } from "@/types/stock-allocation";
import {
  buildWarehouseQuantityChartData,
  buildWarehouseRollupMetrics,
  buildWarehouseSharePieData,
  formatWarehouseRollupForAi,
} from "./business-insights-warehouse-rollup";

const FIXTURE: WarehouseStockSummary[] = [
  {
    warehouseId: "wh-a",
    warehouseName: "Main",
    totalProducts: 3,
    totalQuantity: 80,
    totalReserved: 10,
    totalValue: 4000,
  },
  {
    warehouseId: "wh-b",
    warehouseName: "East",
    totalProducts: 2,
    totalQuantity: 20,
    totalReserved: 5,
    totalValue: 1000,
  },
  {
    warehouseId: "wh-c",
    warehouseName: "Empty",
    totalProducts: 0,
    totalQuantity: 0,
    totalReserved: 0,
    totalValue: 0,
  },
];

describe("buildWarehouseRollupMetrics", () => {
  it("aggregates totals and top warehouse share", () => {
    const metrics = buildWarehouseRollupMetrics(FIXTURE);
    expect(metrics.warehouseCount).toBe(3);
    expect(metrics.warehousesWithStock).toBe(2);
    expect(metrics.totalSkus).toBe(5);
    expect(metrics.totalQuantity).toBe(100);
    expect(metrics.totalReserved).toBe(15);
    expect(metrics.totalValue).toBe(5000);
    expect(metrics.topWarehouse).toEqual({
      name: "Main",
      quantity: 80,
      sharePct: 80,
    });
    expect(metrics.concentrationPct).toBe(80);
  });

  it("returns zeros for empty input", () => {
    const metrics = buildWarehouseRollupMetrics([]);
    expect(metrics.warehouseCount).toBe(0);
    expect(metrics.topWarehouse).toBeNull();
  });
});

describe("buildWarehouseQuantityChartData", () => {
  it("excludes zero-qty warehouses and sorts by quantity", () => {
    const rows = buildWarehouseQuantityChartData(FIXTURE);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toBeDefined();
    expect(rows[1]).toBeDefined();
    expect(rows[0]!.name).toBe("Main");
    expect(rows[1]!.name).toBe("East");
  });
});

describe("buildWarehouseSharePieData", () => {
  it("maps quantity to pie value", () => {
    const slices = buildWarehouseSharePieData(FIXTURE);
    expect(slices).toEqual([
      { name: "Main", value: 80 },
      { name: "East", value: 20 },
    ]);
  });
});

describe("formatWarehouseRollupForAi", () => {
  it("includes top warehouses when stock exists", () => {
    const metrics = buildWarehouseRollupMetrics(FIXTURE);
    const chart = buildWarehouseQuantityChartData(FIXTURE);
    const text = formatWarehouseRollupForAi(metrics, chart);
    expect(text).toContain("Main 80 units");
    expect(text).toContain("80%");
  });

  it("reports no allocations when empty", () => {
    const text = formatWarehouseRollupForAi(
      buildWarehouseRollupMetrics([]),
      [],
    );
    expect(text).toContain("no allocations yet");
  });
});
