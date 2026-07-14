import { describe, expect, it } from "vitest";
import {
  getAllocationQtyBounds,
  validateAllocationUpsert,
} from "./validate-allocation-quantity";

describe("validateAllocationUpsert", () => {
  const allocations = [
    { warehouseId: "wh-a", quantity: 40 },
    { warehouseId: "wh-b", quantity: 20 },
  ];

  it("accepts qty within budget for existing warehouse row", () => {
    const result = validateAllocationUpsert({
      catalogQty: 100,
      allocations,
      targetWarehouseId: "wh-a",
      newAbsoluteQty: 70,
      rowReserved: 0,
    });
    expect(result).toEqual({ ok: true });
  });

  it("accepts new row up to unallocated catalog", () => {
    const result = validateAllocationUpsert({
      catalogQty: 100,
      allocations,
      targetWarehouseId: "wh-c",
      newAbsoluteQty: 40,
      rowReserved: 0,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects qty above catalog budget", () => {
    const result = validateAllocationUpsert({
      catalogQty: 100,
      allocations,
      targetWarehouseId: "wh-a",
      newAbsoluteQty: 90,
      rowReserved: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Maximum assignable");
    }
  });

  it("rejects qty below reserved floor", () => {
    const result = validateAllocationUpsert({
      catalogQty: 100,
      allocations,
      targetWarehouseId: "wh-a",
      newAbsoluteQty: 5,
      rowReserved: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("reserved");
    }
  });

  it("getAllocationQtyBounds returns min/max and budget parts", () => {
    const bounds = getAllocationQtyBounds({
      catalogQty: 100,
      allocations,
      targetWarehouseId: "wh-a",
      newAbsoluteQty: 0,
      rowReserved: 10,
    });
    expect(bounds).toEqual({
      minQty: 10,
      maxQty: 80,
      unallocated: 40,
      currentInWarehouse: 40,
    });
  });
});
