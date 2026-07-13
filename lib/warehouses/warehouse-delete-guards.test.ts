import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWarehouseDeleteBlockers } from "./warehouse-delete-guards";

vi.mock("@/prisma/client", () => ({
  prisma: {
    stockAllocation: { count: vi.fn() },
    orderItem: { findMany: vi.fn() },
    stockTransfer: { count: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";

describe("getWarehouseDeleteBlockers", () => {
  beforeEach(() => {
    vi.mocked(prisma.stockAllocation.count).mockReset();
    vi.mocked(prisma.orderItem.findMany).mockReset();
    vi.mocked(prisma.stockTransfer.count).mockReset();
  });

  it("returns not blocked when warehouse is clean", async () => {
    vi.mocked(prisma.stockAllocation.count).mockResolvedValue(0);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.stockTransfer.count).mockResolvedValue(0);

    const result = await getWarehouseDeleteBlockers("wh-1");
    expect(result).toEqual({ blocked: false, reasons: [] });
  });

  it("blocks when allocations have reserved stock", async () => {
    vi.mocked(prisma.stockAllocation.count).mockResolvedValue(2);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.stockTransfer.count).mockResolvedValue(0);

    const result = await getWarehouseDeleteBlockers("wh-1");
    expect(result.blocked).toBe(true);
    expect(result.reasons[0]).toContain("reserved");
  });

  it("blocks when active order lines pick from warehouse", async () => {
    vi.mocked(prisma.stockAllocation.count).mockResolvedValue(0);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
      { quantity: 3, order: { status: "pending" } },
    ]);
    vi.mocked(prisma.stockTransfer.count).mockResolvedValue(0);

    const result = await getWarehouseDeleteBlockers("wh-1");
    expect(result.blocked).toBe(true);
    expect(result.reasons[0]).toContain("active order");
  });

  it("blocks when pending transfers involve warehouse", async () => {
    vi.mocked(prisma.stockAllocation.count).mockResolvedValue(0);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.stockTransfer.count).mockResolvedValue(1);

    const result = await getWarehouseDeleteBlockers("wh-1");
    expect(result.blocked).toBe(true);
    expect(result.reasons[0]).toContain("pending stock transfer");
  });
});
