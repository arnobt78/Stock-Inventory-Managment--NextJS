import { describe, expect, it } from "vitest";
import { planAllocationDecrements } from "./plan-allocation-decrements";

describe("planAllocationDecrements", () => {
  it("deducts greedily from largest available first", () => {
    const steps = planAllocationDecrements(
      [
        { id: "a", quantity: 10, reservedQuantity: 0 },
        { id: "b", quantity: 30, reservedQuantity: 5 },
        { id: "c", quantity: 8, reservedQuantity: 0 },
      ],
      20,
    );
    expect(steps).toEqual([
      { id: "b", deduct: 20 },
    ]);
  });

  it("skips fully reserved rows", () => {
    const steps = planAllocationDecrements(
      [
        { id: "a", quantity: 10, reservedQuantity: 10 },
        { id: "b", quantity: 5, reservedQuantity: 0 },
      ],
      3,
    );
    expect(steps).toEqual([{ id: "b", deduct: 3 }]);
  });

  it("spreads partial deduct across multiple warehouses", () => {
    const steps = planAllocationDecrements(
      [
        { id: "a", quantity: 10, reservedQuantity: 0 },
        { id: "b", quantity: 10, reservedQuantity: 0 },
      ],
      15,
    );
    expect(steps).toEqual([
      { id: "a", deduct: 10 },
      { id: "b", deduct: 5 },
    ]);
  });

  it("deducts all available when requested exceeds total", () => {
    const steps = planAllocationDecrements(
      [{ id: "a", quantity: 5, reservedQuantity: 1 }],
      100,
    );
    expect(steps).toEqual([{ id: "a", deduct: 4 }]);
  });

  it("returns empty plan for non-positive requested qty", () => {
    expect(planAllocationDecrements([{ id: "a", quantity: 5, reservedQuantity: 0 }], 0)).toEqual([]);
    expect(planAllocationDecrements([{ id: "a", quantity: 5, reservedQuantity: 0 }], -1)).toEqual([]);
  });
});
