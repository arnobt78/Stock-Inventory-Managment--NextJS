import { describe, expect, it } from "vitest";
import * as tips from "./order-invoice-column-tooltips";

describe("order-invoice-column-tooltips", () => {
  it("exports non-empty help strings for dense headers", () => {
    const values = Object.values(tips);
    expect(values.length).toBeGreaterThanOrEqual(8);
    for (const v of values) {
      expect(typeof v).toBe("string");
      expect(v.trim().length).toBeGreaterThan(20);
    }
  });
});
