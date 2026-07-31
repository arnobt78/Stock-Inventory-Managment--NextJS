import { describe, expect, it } from "vitest";
import {
  computeCatalogInsights,
  CATALOG_LOW_STOCK_THRESHOLD,
} from "@/lib/server/catalog-insights";
import { buildCategoryForecastRollup } from "@/lib/forecasting/category-forecast-rollup";
import type { ProductDemandForecast } from "@/types";

describe("buildCategoryForecastRollup", () => {
  const forecasts: ProductDemandForecast[] = [
    {
      productId: "p1",
      productName: "A",
      sku: "SKU-A",
      imageUrl: "https://example.com/a.jpg",
      categoryId: "c1",
      categoryName: "Cat",
      supplierId: "s1",
      supplierName: "Sup",
      supplierImage: null,
      currentStock: 2,
      availableStock: 1,
      averageDailySales: 2,
      predictedDailySales: 3,
      daysUntilStockout: 1,
      reorderRecommendation: "urgent",
      suggestedReorderQuantity: 10,
      confidenceScore: 80,
    },
    {
      productId: "p2",
      productName: "B",
      sku: "SKU-B",
      currentStock: 10,
      availableStock: 8,
      averageDailySales: 1,
      predictedDailySales: 1.5,
      daysUntilStockout: 5,
      reorderRecommendation: "soon",
      suggestedReorderQuantity: 5,
      confidenceScore: 70,
    },
    {
      productId: "p-other",
      productName: "Other",
      sku: "SKU-O",
      currentStock: 100,
      availableStock: 100,
      averageDailySales: 0,
      predictedDailySales: 0,
      daysUntilStockout: null,
      reorderRecommendation: "normal",
      suggestedReorderQuantity: 0,
      confidenceScore: 50,
    },
  ];

  it("filters forecasts to category product IDs", () => {
    const rollup = buildCategoryForecastRollup(
      forecasts,
      new Set(["p1", "p2"]),
    );
    expect(rollup.urgentReorderCount).toBe(1);
    expect(rollup.soonReorderCount).toBe(1);
    expect(rollup.predictedDailyDemand).toBe(4.5);
    expect(rollup.topUrgent).toHaveLength(1);
    expect(rollup.topUrgent[0]?.productId).toBe("p1");
    expect(rollup.topUrgent[0]?.imageUrl).toBe("https://example.com/a.jpg");
    expect(rollup.topUrgent[0]?.categoryName).toBe("Cat");
    expect(rollup.topUrgent[0]?.supplierName).toBe("Sup");
  });
});

describe("computeCatalogInsights", () => {
  it("counts low and out of stock products", () => {
    const products = [
      {
        quantity: BigInt(0),
        price: 10,
        orderItems: [],
        userId: "u1",
        supplierId: "s1",
        reservedQuantity: BigInt(0),
      },
      {
        quantity: BigInt(CATALOG_LOW_STOCK_THRESHOLD),
        price: 10,
        orderItems: [],
        userId: "u1",
        supplierId: "s1",
        reservedQuantity: BigInt(0),
      },
      {
        quantity: BigInt(100),
        price: 10,
        orderItems: [],
        userId: "u1",
        supplierId: "s1",
        reservedQuantity: BigInt(0),
      },
    ] as unknown as Parameters<typeof computeCatalogInsights>[0];

    const insights = computeCatalogInsights(products, 200, 2, 50);
    expect(insights.outOfStockCount).toBe(1);
    expect(insights.lowStockCount).toBe(1);
    expect(insights.stockBreakdown.out).toBe(1);
    expect(insights.stockBreakdown.low).toBe(1);
    expect(insights.stockBreakdown.available).toBe(1);
    expect(insights.avgOrderValue).toBe(100);
  });
});
