import { describe, expect, it } from "vitest";
import { enrichProductInsightsWithWarehouseStock } from "@/lib/insights/product-insights-enrich";
import type { CatalogEntityInsights } from "@/types/catalog-insights";

const baseInsights: CatalogEntityInsights = {
  lowStockCount: 0,
  outOfStockCount: 0,
  avgOrderValue: 10,
  demandVelocity: 1,
  salesTrend: [],
  stockBreakdown: { available: 1, low: 0, out: 0 },
};

describe("enrichProductInsightsWithWarehouseStock", () => {
  it("passthrough when allocations empty", () => {
    expect(enrichProductInsightsWithWarehouseStock(baseInsights, [])).toBe(
      baseInsights,
    );
    expect(
      enrichProductInsightsWithWarehouseStock(baseInsights, null),
    ).toBe(baseInsights);
  });

  it("merges warehouseStock from allocations", () => {
    const enriched = enrichProductInsightsWithWarehouseStock(baseInsights, [
      {
        id: "a1",
        productId: "p1",
        warehouseId: "w1",
        quantity: 20,
        reservedQuantity: 5,
        userId: "u1",
        createdAt: "",
        updatedAt: null,
      },
    ]);
    expect(enriched.warehouseStock).toEqual({ available: 15, reserved: 5 });
    expect(enriched.stockBreakdown).toEqual(baseInsights.stockBreakdown);
  });

  it("adds unallocated when catalog quantity exceeds allocated sum", () => {
    const enriched = enrichProductInsightsWithWarehouseStock(
      baseInsights,
      [
        {
          id: "a1",
          productId: "p1",
          warehouseId: "w1",
          quantity: 29,
          reservedQuantity: 0,
          userId: "u1",
          createdAt: "",
          updatedAt: null,
        },
      ],
      49,
    );
    expect(enriched.warehouseStock).toEqual({
      available: 29,
      reserved: 0,
      unallocated: 20,
    });
  });
});
