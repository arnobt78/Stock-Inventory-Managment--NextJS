import { describe, expect, it } from "vitest";
import { shouldShowAdjustedPrice } from "./ProportionalPriceDisplay";

describe("ProportionalPriceDisplay", () => {
  describe("shouldShowAdjustedPrice", () => {
    it("returns false when amounts match", () => {
      expect(shouldShowAdjustedPrice(100, 100)).toBe(false);
    });

    it("returns true when adjusted differs (fee-adjusted order)", () => {
      expect(shouldShowAdjustedPrice(600, 346.99)).toBe(true);
    });

    it("returns false when adjusted is undefined", () => {
      expect(shouldShowAdjustedPrice(100, undefined)).toBe(false);
    });

    it("returns false within epsilon", () => {
      expect(shouldShowAdjustedPrice(100, 100.004)).toBe(false);
    });
  });
});
