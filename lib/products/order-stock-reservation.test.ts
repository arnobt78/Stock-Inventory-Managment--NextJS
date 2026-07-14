/**
 * REQ-0103 — disjoint order stock reservation tests.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockProductUpdate = vi.fn();
const mockReserveAllocation = vi.fn();
const mockReleaseAllocation = vi.fn();
const mockFulfillAllocation = vi.fn();
const mockDecrementAllocations = vi.fn();

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: {
      update: (...args: unknown[]) => mockProductUpdate(...args),
    },
  },
}));

vi.mock("./stock-allocation-order-sync", () => ({
  reserveAllocationForOrderItem: (...args: unknown[]) =>
    mockReserveAllocation(...args),
  releaseAllocationReservation: (...args: unknown[]) =>
    mockReleaseAllocation(...args),
  fulfillAllocationFromPick: (...args: unknown[]) =>
    mockFulfillAllocation(...args),
}));

vi.mock("./decrement-stock-allocations", () => ({
  decrementStockAllocations: (...args: unknown[]) =>
    mockDecrementAllocations(...args),
}));

import {
  fulfillPendingOrderLine,
  getAvailableCatalogForOrder,
  releasePendingOrderLine,
  reservePendingOrderLine,
} from "./order-stock-reservation";

describe("order-stock-reservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductUpdate.mockResolvedValue({});
    mockReserveAllocation.mockResolvedValue(undefined);
    mockReleaseAllocation.mockResolvedValue(undefined);
    mockFulfillAllocation.mockResolvedValue(undefined);
    mockDecrementAllocations.mockResolvedValue(undefined);
  });

  it("reservePendingOrderLine with warehouse pick updates allocation only", async () => {
    await reservePendingOrderLine({
      productId: "prod1",
      quantity: 20,
      warehouseId: "wh1",
    });

    expect(mockReserveAllocation).toHaveBeenCalledWith("prod1", "wh1", 20);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });

  it("reservePendingOrderLine without warehouse pick updates product only", async () => {
    await reservePendingOrderLine({
      productId: "prod1",
      quantity: 5,
      warehouseId: null,
    });

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod1" },
      data: { reservedQuantity: { increment: 5 } },
    });
    expect(mockReserveAllocation).not.toHaveBeenCalled();
  });

  it("REQ-0106 auto-assign reserves catalog pool only (qty 40, no warehouse pick)", async () => {
    await reservePendingOrderLine({
      productId: "prod1",
      quantity: 40,
      warehouseId: null,
    });

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod1" },
      data: { reservedQuantity: { increment: 40 } },
    });
    expect(mockReserveAllocation).not.toHaveBeenCalled();
  });

  it("releasePendingOrderLine with warehouse pick releases allocation only", async () => {
    await releasePendingOrderLine({
      productId: "prod1",
      quantity: 20,
      warehouseId: "wh1",
    });

    expect(mockReleaseAllocation).toHaveBeenCalledWith("prod1", "wh1", 20);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });

  it("releasePendingOrderLine without warehouse pick releases product only", async () => {
    await releasePendingOrderLine({
      productId: "prod1",
      quantity: 5,
    });

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod1" },
      data: { reservedQuantity: { decrement: 5 } },
    });
    expect(mockReleaseAllocation).not.toHaveBeenCalled();
  });

  it("fulfillPendingOrderLine with warehouse pick deducts catalog and fulfills pick", async () => {
    await fulfillPendingOrderLine({
      productId: "prod1",
      quantity: 20,
      warehouseId: "wh1",
    });

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod1" },
      data: { quantity: { decrement: 20 } },
    });
    expect(mockFulfillAllocation).toHaveBeenCalledWith(
      "prod1",
      "wh1",
      20,
      { releaseReservation: true },
    );
    expect(mockDecrementAllocations).not.toHaveBeenCalled();
  });

  it("fulfillPendingOrderLine without warehouse pick deducts product and greedy allocations", async () => {
    await fulfillPendingOrderLine({
      productId: "prod1",
      quantity: 5,
    });

    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod1" },
      data: {
        quantity: { decrement: 5 },
        reservedQuantity: { decrement: 5 },
      },
    });
    expect(mockDecrementAllocations).toHaveBeenCalledWith([
      { productId: "prod1", quantity: 5 },
    ]);
    expect(mockFulfillAllocation).not.toHaveBeenCalled();
  });

  it("getAvailableCatalogForOrder subtracts disjoint commitment", () => {
    expect(
      getAvailableCatalogForOrder(40, 0, [{ reservedQuantity: 20 }]),
    ).toBe(20);
    expect(getAvailableCatalogForOrder(40, 5, [{ reservedQuantity: 0 }])).toBe(
      35,
    );
  });
});
