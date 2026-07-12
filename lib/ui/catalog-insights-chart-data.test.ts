import { describe, expect, it } from "vitest";
import {
  buildWarehouseAllocationStockChartData,
  buildWarehouseStockChartDescription,
} from "@/lib/ui/catalog-insights-chart-data";
import type { CatalogEntityInsights } from "@/types/catalog-insights";

const baseInsights: CatalogEntityInsights = {
  lowStockCount: 0,
  outOfStockCount: 0,
  avgOrderValue: 0,
  demandVelocity: 0,
  salesTrend: [],
  stockBreakdown: { available: 1, low: 0, out: 0 },
};

describe("buildWarehouseAllocationStockChartData", () => {
  it("includes unallocated slice when warehouseStock has unallocated qty", () => {
    const insights: CatalogEntityInsights = {
      ...baseInsights,
      warehouseStock: { available: 29, reserved: 0, unallocated: 20 },
    };
    const rows = buildWarehouseAllocationStockChartData(insights);
    expect(rows).toEqual([
      { name: "Available", value: 29 },
      { name: "Unallocated", value: 20 },
    ]);
  });

  it("omits unallocated slice when zero", () => {
    const insights: CatalogEntityInsights = {
      ...baseInsights,
      warehouseStock: { available: 49, reserved: 0, unallocated: 0 },
    };
    const rows = buildWarehouseAllocationStockChartData(insights);
    expect(rows).toEqual([{ name: "Available", value: 49 }]);
  });
});

describe("buildWarehouseStockChartDescription", () => {
  it("builds reconciled subtitle for catalog vs warehouse totals", () => {
    const insights: CatalogEntityInsights = {
      ...baseInsights,
      warehouseStock: { available: 29, reserved: 0, unallocated: 20 },
    };
    expect(buildWarehouseStockChartDescription(insights, 49)).toBe(
      "29 in warehouses · 20 unallocated · 49 catalog total",
    );
  });
});
