import { describe, expect, it } from "vitest";
import {
  computeWarehouseInsights,
  mapWarehouseStockSummary,
} from "@/lib/insights/warehouse-insights-compute";

describe("computeWarehouseInsights", () => {
  it("aggregates SKU counts and category mix", () => {
    const insights = computeWarehouseInsights([
      {
        id: "a1",
        productId: "p1",
        warehouseId: "w1",
        quantity: 30,
        reservedQuantity: 10,
        userId: "u1",
        createdAt: "",
        updatedAt: null,
        product: {
          id: "p1",
          name: "A",
          sku: "SKU-A",
          categoryName: "Electronics",
        },
      },
      {
        id: "a2",
        productId: "p2",
        warehouseId: "w1",
        quantity: 5,
        reservedQuantity: 0,
        userId: "u1",
        createdAt: "",
        updatedAt: null,
        product: {
          id: "p2",
          name: "B",
          sku: "SKU-B",
          categoryName: "Electronics",
        },
      },
    ]);

    expect(insights.totalSkus).toBe(2);
    expect(insights.totalUnits).toBe(35);
    expect(insights.availableUnits).toBe(25);
    expect(insights.reservedUnits).toBe(10);
    expect(insights.lowStockSkuCount).toBe(2);
    expect(insights.categoryMix[0]?.name).toBe("Electronics");
    expect(insights.categoryMix[0]?.count).toBe(2);
  });
});

describe("mapWarehouseStockSummary", () => {
  it("returns null when allocation row count is zero", () => {
    const insights = computeWarehouseInsights([]);
    expect(mapWarehouseStockSummary(insights, 0)).toBeNull();
  });

  it("maps insights KPIs to warehouse detail stat card fields", () => {
    const insights = computeWarehouseInsights([
      {
        id: "a1",
        productId: "p1",
        warehouseId: "w1",
        quantity: 30,
        reservedQuantity: 10,
        userId: "u1",
        createdAt: "",
        updatedAt: null,
        product: {
          id: "p1",
          name: "A",
          sku: "SKU-A",
          categoryName: "Electronics",
        },
      },
    ]);

    expect(mapWarehouseStockSummary(insights, 1)).toEqual({
      totalProducts: 1,
      totalQuantity: 30,
      availableQuantity: 20,
      reservedQuantity: 10,
    });
  });
});
