import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    stockAllocation: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    supplier: { findMany: vi.fn() },
    warehouse: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";
import { getStockByWarehouseForPage } from "./warehouse-stock-data";

describe("getStockByWarehouseForPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns enriched rows with cross-warehouse catalog totals (REQ-0102)", async () => {
    vi.mocked(prisma.warehouse.findFirst).mockResolvedValue({
      id: "wh-1",
      name: "Main Warehouse",
      userId: "admin-owner",
    } as never);

    vi.mocked(prisma.stockAllocation.findMany)
      .mockResolvedValueOnce([
        {
          id: "alloc-1",
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 40,
          reservedQuantity: 0,
          userId: "admin-owner",
          createdAt: new Date("2026-01-01"),
          updatedAt: null,
        },
      ] as never)
      .mockResolvedValueOnce([
        { productId: "prod-1", reservedQuantity: 0 },
      ] as never)
      .mockResolvedValueOnce([{ productId: "prod-1", quantity: BigInt(40) }] as never);

    vi.mocked(prisma.product.findMany)
      .mockResolvedValueOnce([
        {
          id: "prod-1",
          name: "Widget",
          sku: "W-1",
          imageUrl: null,
          price: 9.5,
          quantity: 100,
          categoryId: null,
          supplierId: null,
          deletedAt: null,
          reservedQuantity: 0,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "prod-1", quantity: BigInt(100) }] as never);

    vi.mocked(prisma.category.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([] as never);

    vi.mocked(prisma.warehouse.findMany).mockResolvedValue([
      { id: "wh-1", name: "Main Warehouse", status: true },
    ] as never);

    const result = await getStockByWarehouseForPage(
      { id: "admin-owner", role: "admin" },
      "wh-1",
    );

    expect(result).toHaveLength(1);
    expect(result![0].product).toMatchObject({
      quantity: 100,
      allocatedTotal: 40,
      unallocated: 60,
    });
  });

  it("returns null when warehouse is not accessible", async () => {
    vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null);
    const result = await getStockByWarehouseForPage(
      { id: "user-1", role: "supplier" },
      "wh-missing",
    );
    expect(result).toBeNull();
    expect(prisma.stockAllocation.findMany).not.toHaveBeenCalled();
  });
});
