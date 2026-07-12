import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    stockAllocation: { findMany: vi.fn() },
    product: { findUnique: vi.fn() },
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

    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: "prod-1",
      name: "Widget",
      sku: "W-1",
      imageUrl: null,
    } as never);

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
