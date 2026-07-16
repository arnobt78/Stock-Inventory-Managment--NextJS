import { describe, expect, it } from "vitest";
import {
  formatOrderProductPreview,
  getOrderItemUnitCounts,
  truncateOrderProductName,
} from "./order-list-meta";

describe("truncateOrderProductName", () => {
  it("returns short names unchanged", () => {
    expect(truncateOrderProductName("Beats", 28)).toBe("Beats");
  });

  it("truncates long names with ellipsis", () => {
    expect(truncateOrderProductName("ABCDEFGHIJKLMNOPQRSTUVWXYZ12", 10)).toBe(
      "ABCDEFGHI…",
    );
  });
});

describe("formatOrderProductPreview", () => {
  it("returns null for empty items", () => {
    expect(formatOrderProductPreview([])).toBeNull();
    expect(formatOrderProductPreview(null)).toBeNull();
  });

  it("joins up to maxNames with middle dot", () => {
    expect(
      formatOrderProductPreview(
        [
          { productName: "Beats Studio3", quantity: 1 },
          { productName: "Sony WH", quantity: 2 },
        ],
        { maxNames: 2 },
      ),
    ).toBe("Beats Studio3 · Sony WH");
  });

  it("appends +N when more products exist", () => {
    expect(
      formatOrderProductPreview(
        [
          { productName: "A", quantity: 1 },
          { productName: "B", quantity: 1 },
          { productName: "C", quantity: 1 },
        ],
        { maxNames: 2 },
      ),
    ).toBe("A · B +1");
  });
});

describe("getOrderItemUnitCounts", () => {
  it("sums quantities", () => {
    expect(
      getOrderItemUnitCounts([
        { productName: "A", quantity: 1 },
        { productName: "B", quantity: 20 },
      ]),
    ).toEqual({ itemCount: 2, unitCount: 21 });
  });
});
