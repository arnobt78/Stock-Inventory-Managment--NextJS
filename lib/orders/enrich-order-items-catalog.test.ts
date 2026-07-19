import { describe, expect, it, vi, beforeEach } from "vitest";
import { enrichOrderItemsCatalogNames } from "./enrich-order-items-catalog";
import type { OrderItem } from "@/types";

vi.mock("@/prisma/client", () => ({
  prisma: {
    category: { findMany: vi.fn() },
    supplier: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";

const baseItem: OrderItem = {
  id: "item-1",
  orderId: "order-1",
  productId: "prod-1",
  productName: "Widget",
  quantity: 2,
  price: 10,
  subtotal: 20,
  createdAt: "2026-01-01T00:00:00.000Z",
  categoryId: "cat-1",
  supplierId: "sup-1",
};

describe("enrichOrderItemsCatalogNames", () => {
  beforeEach(() => {
    vi.mocked(prisma.category.findMany).mockReset();
    vi.mocked(prisma.supplier.findMany).mockReset();
  });

  it("returns empty array unchanged", async () => {
    const result = await enrichOrderItemsCatalogNames([]);
    expect(result).toEqual([]);
    expect(prisma.category.findMany).not.toHaveBeenCalled();
    expect(prisma.supplier.findMany).not.toHaveBeenCalled();
  });

  it("maps category and supplier names from IDs", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: "cat-1", name: "Gadgets" },
    ] as never);
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([
      { id: "sup-1", name: "Acme Corp" },
    ] as never);

    const result = await enrichOrderItemsCatalogNames([baseItem]);

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["cat-1"] } },
      select: { id: true, name: true },
    });
    expect(prisma.supplier.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["sup-1"] } },
      select: { id: true, name: true },
    });
    expect(result[0]).toMatchObject({
      categoryName: "Gadgets",
      supplierName: "Acme Corp",
    });
  });

  it("returns null names when ID missing in DB", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([]);
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([]);

    const result = await enrichOrderItemsCatalogNames([baseItem]);

    expect(result[0]).toBeDefined();
    expect(result[0]!.categoryName).toBeNull();
    expect(result[0]!.supplierName).toBeNull();
  });

  it("skips prisma when no category or supplier IDs", async () => {
    const item: OrderItem = {
      ...baseItem,
      categoryId: undefined,
      supplierId: undefined,
    };

    const result = await enrichOrderItemsCatalogNames([item]);

    expect(result[0]).toMatchObject({
      ...item,
      categoryName: null,
      supplierName: null,
    });
    expect(prisma.category.findMany).not.toHaveBeenCalled();
    expect(prisma.supplier.findMany).not.toHaveBeenCalled();
  });
});
