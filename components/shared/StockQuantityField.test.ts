import { describe, expect, it } from "vitest";
import { getStockQuantityValidation } from "@/components/shared/StockQuantityField";

describe("getStockQuantityValidation", () => {
  it("blocks allocate edit below reserved floor", () => {
    const result = getStockQuantityValidation("10", 25, "allocate", 20);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("20 reserved");
  });

  it("allows allocate at reserved floor", () => {
    const result = getStockQuantityValidation("20", 25, "allocate", 20);
    expect(result.valid).toBe(true);
  });
});
