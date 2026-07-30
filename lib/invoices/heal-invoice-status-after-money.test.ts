/**
 * REQ-0215 — healInvoiceStatusAfterMoney promotes sent→paid and syncs order.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/cache", () => ({
  invalidateOnOrderChange: vi.fn(async () => undefined),
}));

vi.mock("@/prisma/client", () => ({
  prisma: {
    invoice: { findUnique: vi.fn(), update: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/products/order-stock-reservation", () => ({
  fulfillPendingOrderLines: vi.fn(async () => undefined),
}));

import { prisma } from "@/prisma/client";
import { invalidateOnOrderChange } from "@/lib/cache";
import { healInvoiceStatusAfterMoney } from "./heal-invoice-status-after-money";

describe("healInvoiceStatusAfterMoney (REQ-0215)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("promotes sent + full money to paid and syncs order partial→paid", async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-1",
      orderId: "ord-1",
      status: "sent",
      amountPaid: 1880.06,
      amountDue: 0,
      total: 1880.06,
      sentAt: new Date(),
      paidAt: null,
    } as never);

    vi.mocked(prisma.invoice.update).mockResolvedValue({
      id: "inv-1",
      orderId: "ord-1",
      status: "paid",
      amountPaid: 1880.06,
      amountDue: 0,
      total: 1880.06,
    } as never);

    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce({ paymentStatus: "partial" } as never)
      .mockResolvedValueOnce({
        id: "ord-1",
        paymentStatus: "partial",
        status: "shipped",
        items: [],
      } as never);

    vi.mocked(prisma.order.update).mockResolvedValue({} as never);

    const result = await healInvoiceStatusAfterMoney("inv-1");

    expect(result?.status).toBe("paid");
    expect(result?.changed).toBe(true);
    expect(prisma.invoice.update).toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord-1" },
        data: expect.objectContaining({ paymentStatus: "paid" }),
      }),
    );
    expect(invalidateOnOrderChange).toHaveBeenCalled();
  });

  it("no-ops when already paid and order already paid", async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-2",
      orderId: "ord-2",
      status: "paid",
      amountPaid: 100,
      amountDue: 0,
      total: 100,
      sentAt: new Date(),
      paidAt: new Date(),
    } as never);

    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce({ paymentStatus: "paid" } as never)
      .mockResolvedValueOnce({
        id: "ord-2",
        paymentStatus: "paid",
        status: "delivered",
        items: [],
      } as never);

    const result = await healInvoiceStatusAfterMoney("inv-2");

    expect(result?.changed).toBe(false);
    expect(prisma.invoice.update).not.toHaveBeenCalled();
    expect(invalidateOnOrderChange).not.toHaveBeenCalled();
  });
});
