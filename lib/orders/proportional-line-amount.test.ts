import { describe, expect, it } from "vitest";
import {
  computeProportionalLineAmount,
  orderHasFeeAdjustments,
} from "./proportional-line-amount";

describe("proportional-line-amount", () => {
  it("computeProportionalLineAmount scales by order total", () => {
    expect(computeProportionalLineAmount(600, 600, 346.99)).toBeCloseTo(
      346.99,
      2,
    );
  });

  it("falls back to item subtotal when order subtotal is zero", () => {
    expect(computeProportionalLineAmount(30, 0, 34)).toBe(30);
  });

  it("orderHasFeeAdjustments detects discount/tax delta", () => {
    expect(orderHasFeeAdjustments(600, 346.99)).toBe(true);
    expect(orderHasFeeAdjustments(30, 30)).toBe(false);
  });
});
