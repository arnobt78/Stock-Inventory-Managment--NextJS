import { describe, expect, it } from "vitest";
import { computeWarehouseInsights } from "@/lib/server/warehouse-insights";

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
