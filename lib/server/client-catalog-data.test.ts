import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    supplier: { findMany: vi.fn(), count: vi.fn() },
    category: { findMany: vi.fn(), count: vi.fn() },
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";
import { getClientCatalogOverview } from "./client-catalog-data";

describe("getClientCatalogOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([
      { id: "s1", name: "Test Supplier", status: true },
    ] as never);
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: "c1", name: "Headphone", status: true, userId: "u1" },
    ] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "p1",
        name: "Widget",
        sku: "W-1",
        price: 49,
        status: "Available",
        categoryId: "c1",
        supplierId: "s1",
        userId: "u1",
      },
    ] as never);
    vi.mocked(prisma.supplier.count).mockResolvedValue(5);
    vi.mocked(prisma.category.count).mockResolvedValue(12);
    vi.mocked(prisma.product.count).mockResolvedValue(100);
    vi.mocked(prisma.product.groupBy).mockResolvedValue([
      { supplierId: "s1", _count: { id: 3 } },
      { categoryId: "c1", _count: { id: 3 } },
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", name: "Test Admin", image: null },
    ] as never);
  });

  it("returns meta totals separate from capped list lengths (REQ-0077)", async () => {
    const result = await getClientCatalogOverview("client-user");

    expect(result.meta).toEqual({
      totalSuppliers: 5,
      totalCategories: 12,
      totalProducts: 100,
    });
    expect(result.suppliers).toHaveLength(1);
    expect(result.products[0]).toBeDefined();
    expect(result.products[0]!.productOwnerImage).toBeNull();
  });
});
