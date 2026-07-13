import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/prisma/client", () => ({
  prisma: {
    warehouse: { findFirst: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";
import { getWarehouseDetailForPage } from "./warehouse-detail-data";

const session = { id: "admin-1", role: "admin" as const };

describe("getWarehouseDetailForPage (REQ-0096)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enriches creator and updater from batched user lookup", async () => {
    vi.mocked(prisma.warehouse.findFirst).mockResolvedValue({
      id: "wh-1",
      name: "Main",
      address: null,
      type: null,
      status: true,
      userId: "admin-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      createdBy: "creator-1",
      updatedBy: "updater-1",
    } as never);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: "creator-1",
        name: "Alice",
        email: "alice@test.com",
        image: null,
      },
      {
        id: "updater-1",
        name: "Bob",
        email: "bob@test.com",
        image: "https://example.com/bob.png",
      },
    ] as never);

    const result = await getWarehouseDetailForPage(session, "wh-1");

    expect(result?.creator).toEqual({
      id: "creator-1",
      name: "Alice",
      email: "alice@test.com",
      image: null,
    });
    expect(result?.updater).toEqual({
      id: "updater-1",
      name: "Bob",
      email: "bob@test.com",
      image: "https://example.com/bob.png",
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["creator-1", "updater-1"] } },
      select: { id: true, name: true, email: true, image: true },
    });
  });

  it("returns null when warehouse is not found", async () => {
    vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null);

    const result = await getWarehouseDetailForPage(session, "missing");

    expect(result).toBeNull();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
