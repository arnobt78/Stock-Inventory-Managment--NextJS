import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    stockAllocation: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    supplier: { findMany: vi.fn() },
    warehouse: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/server/product-detail-data", () => ({
  getProductDetailForPage: vi.fn(),
}));

import { prisma } from "@/prisma/client";
import { getProductDetailForPage } from "@/lib/server/product-detail-data";
import { getStockByProductForPage } from "./product-stock-data";

describe("getStockByProductForPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves warehouses by product owner userId, not session id (REQ-0075 AC1)", async () => {
    vi.mocked(getProductDetailForPage).mockResolvedValue({
      id: "prod-1",
      userId: "admin-owner",
      name: "Widget",
    } as never);

    vi.mocked(prisma.stockAllocation.findMany).mockResolvedValue([
      {
        id: "alloc-1",
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 10,
        reservedQuantity: 2,
        userId: "admin-owner",
        createdAt: new Date("2026-01-01"),
        updatedAt: null,
      },
    ] as never);

    vi.mocked(prisma.product.findMany)
      .mockResolvedValueOnce([
        {
          id: "prod-1",
          name: "Widget",
          sku: "W-1",
          imageUrl: null,
          price: 9.5,
          quantity: 100,
          categoryId: "cat-1",
          supplierId: "sup-1",
          deletedAt: null,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "prod-1", quantity: BigInt(100) }] as never);

    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: "cat-1", name: "Gadgets" },
    ] as never);
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([
      { id: "sup-1", name: "Acme" },
    ] as never);

    vi.mocked(prisma.stockAllocation.findMany)
      .mockResolvedValueOnce([
        {
          id: "alloc-1",
          productId: "prod-1",
          warehouseId: "wh-1",
          quantity: 10,
          reservedQuantity: 2,
          userId: "admin-owner",
          createdAt: new Date("2026-01-01"),
          updatedAt: null,
        },
      ] as never)
      .mockResolvedValueOnce([{ productId: "prod-1", quantity: BigInt(10) }] as never);

    vi.mocked(prisma.warehouse.findMany).mockResolvedValue([
      { id: "wh-1", name: "Main Warehouse", status: true },
    ] as never);

    const result = await getStockByProductForPage(
      { id: "supplier-user", role: "supplier" },
      "prod-1",
    );

    expect(prisma.warehouse.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["wh-1"] }, userId: "admin-owner" },
      select: { id: true, name: true, status: true },
    });
    expect(result).toHaveLength(1);
    expect(result![0].warehouse?.name).toBe("Main Warehouse");
    expect(result![0].warehouse?.status).toBe(true);
    expect(result![0].quantity).toBe(10);
    expect(result![0].product).toMatchObject({
      quantity: 100,
      categoryName: "Gadgets",
      supplierName: "Acme",
      allocatedTotal: 10,
      unallocated: 90,
    });
  });

  it("returns null when product is not accessible", async () => {
    vi.mocked(getProductDetailForPage).mockResolvedValue(null);
    const result = await getStockByProductForPage(
      { id: "supplier-user", role: "supplier" },
      "prod-missing",
    );
    expect(result).toBeNull();
    expect(prisma.stockAllocation.findMany).not.toHaveBeenCalled();
  });
});
