import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: { findFirst: vi.fn() },
  },
}));

vi.mock("@/prisma/supplier", () => ({
  getSupplierByUserId: vi.fn(),
}));

import { prisma } from "@/prisma/client";
import { getSupplierByUserId } from "@/prisma/supplier";
import {
  catalogDetailCacheScope,
  resolveSupplierEntityForSession,
  supplierCanAccessCategory,
  supplierCanAccessSupplierRecord,
  supplierHasAssignedProductInCategory,
} from "./catalog-entity-access";

describe("resolveSupplierEntityForSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to getSupplierByUserId", async () => {
    vi.mocked(getSupplierByUserId).mockResolvedValue({
      id: "sup-1",
      name: "Acme",
    });
    await expect(resolveSupplierEntityForSession("user-1")).resolves.toEqual({
      id: "sup-1",
      name: "Acme",
    });
    expect(getSupplierByUserId).toHaveBeenCalledWith("user-1");
  });
});

describe("supplierHasAssignedProductInCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when a product exists in category for supplier", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: "p1" } as never);
    await expect(
      supplierHasAssignedProductInCategory("cat-1", "sup-1"),
    ).resolves.toBe(true);
    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.any(Array),
        }),
        select: { id: true },
      }),
    );
  });

  it("returns false when no product matches", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);
    await expect(
      supplierHasAssignedProductInCategory("cat-1", "sup-1"),
    ).resolves.toBe(false);
  });
});

describe("supplierCanAccessCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mirrors supplierHasAssignedProductInCategory", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: "p1" } as never);
    await expect(supplierCanAccessCategory("cat-1", "sup-1")).resolves.toBe(true);
  });
});

describe("supplierCanAccessSupplierRecord", () => {
  it("allows only own supplier entity id", () => {
    expect(supplierCanAccessSupplierRecord("sup-1", "sup-1")).toBe(true);
    expect(supplierCanAccessSupplierRecord("sup-2", "sup-1")).toBe(false);
  });
});

describe("catalogDetailCacheScope", () => {
  it("returns supplier scope for supplier role", () => {
    expect(
      catalogDetailCacheScope(
        { id: "user-1", role: "supplier" },
        "sup-entity-1",
      ),
    ).toBe("supplier:sup-entity-1");
  });

  it("returns undefined for admin without scope leak", () => {
    expect(
      catalogDetailCacheScope({ id: "admin-1", role: "admin" }, "sup-1"),
    ).toBeUndefined();
  });

  it("returns undefined for client", () => {
    expect(
      catalogDetailCacheScope({ id: "client-1", role: "client" }),
    ).toBeUndefined();
  });

  it("returns undefined for supplier when entity id missing", () => {
    expect(
      catalogDetailCacheScope({ id: "user-1", role: "supplier" }),
    ).toBeUndefined();
  });
});
