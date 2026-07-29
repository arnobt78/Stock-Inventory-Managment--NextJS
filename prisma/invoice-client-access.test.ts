/**
 * REQ-0214 — getInvoiceByIdForClient buyer + catalog-history via order gate.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/prisma/client", () => ({
  prisma: {
    invoice: { findUnique: vi.fn() },
  },
}));

vi.mock("@/prisma/order", () => ({
  getOrderByIdForClient: vi.fn(),
}));

import { prisma } from "@/prisma/client";
import { getOrderByIdForClient } from "@/prisma/order";
import { getInvoiceByIdForClient } from "@/prisma/invoice";

describe("getInvoiceByIdForClient (REQ-0214)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invoice when clientId matches viewer", async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-1",
      orderId: "ord-1",
      clientId: "client-a",
    } as never);

    const result = await getInvoiceByIdForClient("inv-1", "client-a");

    expect(result?.id).toBe("inv-1");
    expect(getOrderByIdForClient).not.toHaveBeenCalled();
  });

  it("falls back to order catalog gate when clientId differs", async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-2",
      orderId: "ord-2",
      clientId: "other-buyer",
    } as never);
    vi.mocked(getOrderByIdForClient).mockResolvedValue({
      id: "ord-2",
    } as never);

    const result = await getInvoiceByIdForClient("inv-2", "client-viewer");

    expect(getOrderByIdForClient).toHaveBeenCalledWith(
      "ord-2",
      "client-viewer",
    );
    expect(result?.id).toBe("inv-2");
  });

  it("returns null when order gate denies", async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-3",
      orderId: "ord-3",
      clientId: null,
    } as never);
    vi.mocked(getOrderByIdForClient).mockResolvedValue(null);

    const result = await getInvoiceByIdForClient("inv-3", "client-viewer");

    expect(result).toBeNull();
  });

  it("returns null when invoice missing", async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);

    const result = await getInvoiceByIdForClient("missing", "client-viewer");

    expect(result).toBeNull();
    expect(getOrderByIdForClient).not.toHaveBeenCalled();
  });
});
