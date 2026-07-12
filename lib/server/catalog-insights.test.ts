import { describe, expect, it } from "vitest";
import {
  computeCatalogInsights,
  CATALOG_LOW_STOCK_THRESHOLD,
} from "@/lib/server/catalog-insights";

describe("computeCatalogInsights", () => {
  it("counts low and out of stock products", () => {
    const products = [
      {
        quantity: BigInt(0),
        orderItems: [],
      },
      {
        quantity: BigInt(CATALOG_LOW_STOCK_THRESHOLD),
        orderItems: [],
      },
      {
        quantity: BigInt(100),
        orderItems: [],
      },
    ] as Parameters<typeof computeCatalogInsights>[0];

    const insights = computeCatalogInsights(products, 200, 2, 50);
    expect(insights.outOfStockCount).toBe(1);
    expect(insights.lowStockCount).toBe(1);
    expect(insights.stockBreakdown.out).toBe(1);
    expect(insights.stockBreakdown.low).toBe(1);
    expect(insights.stockBreakdown.available).toBe(1);
    expect(insights.avgOrderValue).toBe(100);
  });
});
