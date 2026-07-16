import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/prisma/client";
import {
  enrichCategoriesWithProductCounts,
  enrichSuppliersWithListFields,
} from "@/lib/server/catalog-list-enrich";
import { catalogProductSharePercent } from "@/lib/catalog/catalog-product-share";

describe("catalog-list-enrich (REQ-0141 / REQ-0142)", () => {
  beforeEach(() => {
    vi.mocked(prisma.product.groupBy).mockReset();
    vi.mocked(prisma.product.count).mockReset();
    vi.mocked(prisma.user.findMany).mockReset();
  });

  it("catalogProductSharePercent", () => {
    expect(catalogProductSharePercent(1, 2)).toBe(50);
    expect(catalogProductSharePercent(0, 10)).toBe(0);
    expect(catalogProductSharePercent(5, 0)).toBe(0);
  });

  it("enrichCategoriesWithProductCounts maps groupBy with owner userId", async () => {
    vi.mocked(prisma.product.groupBy).mockResolvedValue([
      { categoryId: "c1", _count: { id: 3 } },
    ] as never);

    const rows = await enrichCategoriesWithProductCounts(
      [
        { id: "c1", name: "A" },
        { id: "c2", name: "B" },
      ],
      "owner-1",
    );
    expect(rows[0]?.productCount).toBe(3);
    expect(rows[1]?.productCount).toBe(0);
    // mergeProductListWhere nests filters under AND
    expect(prisma.product.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ userId: "owner-1" }),
          ]),
        }),
      }),
    );
  });

  it("enrichSuppliersWithListFields attaches count + email (scoped)", async () => {
    vi.mocked(prisma.product.groupBy).mockResolvedValue([
      { supplierId: "s1", _count: { id: 2 } },
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", email: "test@supplier.com" },
    ] as never);

    const rows = await enrichSuppliersWithListFields(
      [
        { id: "s1", userId: "u1", name: "Test" },
        { id: "s2", userId: "missing", name: "Local" },
      ],
      "owner-1",
    );
    expect(rows[0]?.productCount).toBe(2);
    expect(rows[0]?.email).toBe("test@supplier.com");
    expect(rows[1]?.productCount).toBe(0);
    expect(rows[1]?.email).toBeNull();
    expect(prisma.product.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ userId: "owner-1" }),
          ]),
        }),
      }),
    );
  });
});

