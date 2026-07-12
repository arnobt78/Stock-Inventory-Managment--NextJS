import { describe, expect, it } from "vitest";
import {
  aggregateWarehouseStockFromAllocations,
  aggregateWarehouseStockWithUnallocated,
  sumAllocatedQuantity,
} from "@/lib/insights/warehouse-stock-aggregate";
import type { StockAllocation } from "@/types";

const row = (
  quantity: number,
  reservedQuantity: number,
): StockAllocation => ({
  id: "a1",
  productId: "p1",
  warehouseId: "w1",
  quantity,
  reservedQuantity,
  userId: "u1",
  createdAt: "",
  updatedAt: null,
});

describe("sumAllocatedQuantity", () => {
  it("sums row quantity fields", () => {
    expect(
      sumAllocatedQuantity([row(29, 0), row(10, 2)]),
    ).toBe(39);
  });

  it("returns 0 for empty allocations", () => {
    expect(sumAllocatedQuantity([])).toBe(0);
  });
});

describe("aggregateWarehouseStockFromAllocations", () => {
  it("returns undefined when no rows", () => {
    expect(aggregateWarehouseStockFromAllocations([])).toBeUndefined();
  });

  it("sums available and reserved across rows", () => {
    expect(
      aggregateWarehouseStockFromAllocations([row(20, 5), row(10, 0)]),
    ).toEqual({ available: 25, reserved: 5 });
  });
});

describe("aggregateWarehouseStockWithUnallocated", () => {
  it("passthrough without catalog quantity", () => {
    expect(
      aggregateWarehouseStockWithUnallocated([row(29, 0)]),
    ).toEqual({ available: 29, reserved: 0 });
  });

  it("computes unallocated from catalog quantity", () => {
    expect(
      aggregateWarehouseStockWithUnallocated([row(29, 0)], 49),
    ).toEqual({ available: 29, reserved: 0, unallocated: 20 });
  });

  it("never returns negative unallocated", () => {
    expect(
      aggregateWarehouseStockWithUnallocated([row(50, 0)], 49),
    ).toEqual({ available: 50, reserved: 0, unallocated: 0 });
  });
});
