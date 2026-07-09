import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ClientBrowseMeta } from "@/types";

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    user: { findMany: vi.fn(), count: vi.fn() },
    supplier: { count: vi.fn() },
    category: { count: vi.fn() },
    warehouse: { count: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";
import {
  getProductOwnerAdminsForBrowse,
  resolveDefaultBrowseOwnerId,
} from "./client-browse-data";

describe("getProductOwnerAdminsForBrowse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when no product owners exist", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    const result = await getProductOwnerAdminsForBrowse();
    expect(result).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("loads admin/user accounts for distinct product owner ids", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { userId: "owner-a" },
      { userId: "owner-b" },
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "owner-a", name: "Alice", email: "a@test.com" },
    ] as never);

    const result = await getProductOwnerAdminsForBrowse();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { in: ["owner-a", "owner-b"] },
          role: { in: ["admin", "user"] },
        },
      }),
    );
    expect(result).toHaveLength(1);
  });
});

describe("resolveDefaultBrowseOwnerId", () => {
  it("prefers test@admin.com when present in meta", async () => {
    const meta: ClientBrowseMeta = {
      admins: [
        { id: "1", name: "Other", email: "other@test.com" },
        { id: "2", name: "Admin", email: "test@admin.com" },
      ],
      stats: {
        admins: 2,
        clients: 0,
        suppliers: { total: 0, active: 0, inactive: 0 },
        categories: { total: 0, active: 0, inactive: 0 },
        warehouses: { total: 0, active: 0, inactive: 0 },
      },
    };
    await expect(resolveDefaultBrowseOwnerId(meta)).resolves.toBe("2");
  });

  it("falls back to first admin when preferred email missing", async () => {
    const meta: ClientBrowseMeta = {
      admins: [{ id: "first", name: "First", email: "first@test.com" }],
      stats: {
        admins: 1,
        clients: 0,
        suppliers: { total: 0, active: 0, inactive: 0 },
        categories: { total: 0, active: 0, inactive: 0 },
        warehouses: { total: 0, active: 0, inactive: 0 },
      },
    };
    await expect(resolveDefaultBrowseOwnerId(meta)).resolves.toBe("first");
  });

  it("returns empty string when no admins", async () => {
    const meta: ClientBrowseMeta = {
      admins: [],
      stats: {
        admins: 0,
        clients: 0,
        suppliers: { total: 0, active: 0, inactive: 0 },
        categories: { total: 0, active: 0, inactive: 0 },
        warehouses: { total: 0, active: 0, inactive: 0 },
      },
    };
    await expect(resolveDefaultBrowseOwnerId(meta)).resolves.toBe("");
  });
});
