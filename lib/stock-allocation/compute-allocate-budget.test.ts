import { describe, expect, it } from "vitest";
import { computeAllocateBudget } from "./compute-allocate-budget";

describe("computeAllocateBudget", () => {
  it("returns unallocated remainder when other warehouses hold stock", () => {
    const budget = computeAllocateBudget(
      100,
      [
        { warehouseId: "wh-a", quantity: 50 },
        { warehouseId: "wh-b", quantity: 0 },
      ],
      "wh-b",
    );
    expect(budget.unallocated).toBe(50);
    expect(budget.maxSetQuantity).toBe(50);
  });

  it("includes existing row qty in max when editing same warehouse", () => {
    const budget = computeAllocateBudget(
      100,
      [{ warehouseId: "wh-a", quantity: 50 }],
      "wh-a",
    );
    expect(budget.currentInWarehouse).toBe(50);
    expect(budget.maxSetQuantity).toBe(100);
  });
});
