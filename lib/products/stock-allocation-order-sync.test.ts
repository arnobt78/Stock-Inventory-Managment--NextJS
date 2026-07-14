/**
 * REQ-0068 — unit tests for per-warehouse order allocation sync helpers.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockCount = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/prisma/client", () => ({
  prisma: {
    stockAllocation: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    warehouse: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import {
  getProductAllocationWarehouses,
  productRequiresWarehousePick,
  validateWarehousePick,
  reserveAllocationForOrderItem,
  releaseAllocationReservation,
  fulfillAllocationFromPick,
} from "./stock-allocation-order-sync";

describe("stock-allocation-order-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getProductAllocationWarehouses returns owner warehouses with available > 0", async () => {
    mockFindMany
      .mockResolvedValueOnce([
        {
          warehouseId: "wh1",
          quantity: 10n,
          reservedQuantity: 2n,
        },
        {
          warehouseId: "wh2",
          quantity: 5n,
          reservedQuantity: 5n,
        },
      ])
      .mockResolvedValueOnce([
        { id: "wh1", name: "Main DC" },
      ]);

    const result = await getProductAllocationWarehouses("prod1", "owner1");
    expect(result).toEqual([
      { warehouseId: "wh1", warehouseName: "Main DC", available: 8 },
    ]);
  });

  it("productRequiresWarehousePick is true when owner has allocation warehouses", async () => {
    mockFindMany.mockResolvedValueOnce([{ warehouseId: "wh1" }]);
    mockCount.mockResolvedValueOnce(1);
    await expect(
      productRequiresWarehousePick("prod1", "owner1"),
    ).resolves.toBe(true);
  });

  it("validateWarehousePick rejects insufficient warehouse stock", async () => {
    mockFindUnique.mockResolvedValueOnce({
      quantity: 5n,
      reservedQuantity: 4n,
    });
    mockFindFirst.mockResolvedValueOnce({ name: "Main Warehouse" });
    await expect(
      validateWarehousePick("prod1", "wh1", 2),
    ).rejects.toThrow("Max 1 at Main Warehouse");
  });

  it("reserveAllocationForOrderItem increments reservedQuantity", async () => {
    mockFindUnique.mockResolvedValueOnce({
      quantity: 10n,
      reservedQuantity: 0n,
    });
    mockUpdate.mockResolvedValueOnce({});
    await reserveAllocationForOrderItem("prod1", "wh1", 3);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productId_warehouseId: { productId: "prod1", warehouseId: "wh1" },
        },
        data: expect.objectContaining({
          reservedQuantity: { increment: 3 },
        }),
      }),
    );
  });

  it("releaseAllocationReservation decrements reservedQuantity", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "alloc1" });
    mockUpdate.mockResolvedValueOnce({});
    await releaseAllocationReservation("prod1", "wh1", 2);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reservedQuantity: { decrement: 2 },
        }),
      }),
    );
  });

  it("fulfillAllocationFromPick deducts quantity and reservation when pending confirm", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "alloc1" });
    mockUpdate.mockResolvedValueOnce({});
    await fulfillAllocationFromPick("prod1", "wh1", 4, {
      releaseReservation: true,
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: { decrement: 4 },
          reservedQuantity: { decrement: 4 },
        }),
      }),
    );
  });
});
