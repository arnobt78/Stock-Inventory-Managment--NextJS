/**
 * REQ-0200 — getOwnerProductsForSupport owner scope + soft-delete filter.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    supplier: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  cacheKeys: { supportTickets: { list: vi.fn() } },
}));

import { prisma } from "@/prisma/client";
import { getOwnerProductsForSupport } from "./support-tickets-data";
import { mergeProductListWhere } from "@/lib/products/product-query";

describe("getOwnerProductsForSupport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when ownerId is blank", async () => {
    await expect(getOwnerProductsForSupport("  ")).resolves.toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("queries mergeProductListWhere for owner userId and maps party names", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "p1",
        name: "Beats",
        sku: "B1",
        price: 10,
        quantity: BigInt(5),
        userId: "owner-1",
        imageUrl: null,
        categoryId: "cat-1",
        supplierId: "sup-1",
      },
    ] as never);
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: "cat-1", name: "Audio" },
    ] as never);
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([
      { id: "sup-1", name: "Acme", userId: "u-sup" },
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "owner-1", name: "Admin", image: null },
      { id: "u-sup", name: "Sup", image: null },
    ] as never);

    const rows = await getOwnerProductsForSupport("owner-1");

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: mergeProductListWhere({ userId: "owner-1" }),
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        quantity: true,
        userId: true,
        imageUrl: true,
        categoryId: true,
        supplierId: true,
      },
    });
    expect(rows).toEqual([
      {
        id: "p1",
        name: "Beats",
        sku: "B1",
        price: 10,
        quantity: 5,
        userId: "owner-1",
        imageUrl: null,
        category: "Audio",
        supplier: "Acme",
        supplierId: "sup-1",
        productOwnerName: "Admin",
        productOwnerImage: null,
        supplierImage: null,
      },
    ]);
  });
});
