import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/cache", () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  cacheKeys: {
    invoices: {
      list: (filters: Record<string, unknown>) =>
        `invoices:list:v2:${JSON.stringify(filters)}`,
    },
  },
}));

vi.mock("@/prisma/order", () => ({
  getOrdersContainingSupplierProducts: vi.fn(),
}));

vi.mock("@/prisma/invoice", () => ({
  getInvoicesByOrderIds: vi.fn(),
}));

vi.mock("@/lib/invoices/enrich-order-user-ids", () => ({
  fetchOrderUserIdMap: vi.fn(),
}));

vi.mock("@/prisma/client", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
  },
}));

import { getCache, setCache } from "@/lib/cache";
import { getOrdersContainingSupplierProducts } from "@/prisma/order";
import { getInvoicesByOrderIds } from "@/prisma/invoice";
import { fetchOrderUserIdMap } from "@/lib/invoices/enrich-order-user-ids";
import { prisma } from "@/prisma/client";
import { getInvoicesForSupplierId } from "./invoices-data";

const invoiceRow = {
  id: "inv-1",
  invoiceNumber: "INV-001",
  orderId: "ord-1",
  userId: "admin-1",
  clientId: "client-1",
  status: "sent",
  subtotal: 100,
  tax: 10,
  shipping: 5,
  discount: null,
  total: 115,
  amountPaid: 0,
  amountDue: 115,
  dueDate: new Date("2026-06-01"),
  issuedAt: new Date("2026-05-01"),
  sentAt: new Date("2026-05-02"),
  paidAt: null,
  cancelledAt: null,
  paymentLink: null,
  notes: null,
  billingAddress: null,
  createdAt: new Date("2026-05-01"),
  updatedAt: null,
  createdBy: "admin-1",
  updatedBy: null,
};

describe("getInvoicesForSupplierId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCache).mockResolvedValue(null);
    vi.mocked(setCache).mockResolvedValue(undefined);
    vi.mocked(fetchOrderUserIdMap).mockResolvedValue(new Map([["ord-1", "client-1"]]));
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "client-1", name: "Client One", email: "client@example.com" },
    ] as never);
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: "ord-1",
        orderNumber: "ORD-001",
        createdAt: new Date("2026-05-01"),
        status: "confirmed",
        paymentStatus: "unpaid",
        cancelledAt: null,
        deliveredAt: null,
        shippedAt: null,
        updatedAt: null,
        invoice: { paidAt: null },
        items: [
          {
            id: "oi-1",
            orderId: "ord-1",
            productId: "p-1",
            productName: "Beats",
            quantity: 2,
            price: 50,
            subtotal: 100,
            createdAt: new Date("2026-05-01"),
            sku: "SK1",
          },
        ],
      },
    ] as never);
  });

  it("returns invoices for supplier orders and caches with supplierId key (REQ-0076)", async () => {
    vi.mocked(getOrdersContainingSupplierProducts).mockResolvedValue([
      { id: "ord-1" },
    ] as never);
    vi.mocked(getInvoicesByOrderIds).mockResolvedValue([invoiceRow] as never);

    const result = await getInvoicesForSupplierId("supplier-entity-1");

    expect(getOrdersContainingSupplierProducts).toHaveBeenCalledWith(
      "supplier-entity-1",
    );
    expect(getInvoicesByOrderIds).toHaveBeenCalledWith(["ord-1"], {});
    expect(setCache).toHaveBeenCalledWith(
      'invoices:list:v2:{"supplierId":"supplier-entity-1"}',
      expect.arrayContaining([
        expect.objectContaining({
          id: "inv-1",
          invoiceNumber: "INV-001",
          orderId: "ord-1",
          linkedOrderNumber: "ORD-001",
          linkedOrderStatus: "confirmed",
          linkedOrderPaymentStatus: "unpaid",
        }),
      ]),
      300,
      expect.objectContaining({ fetchedAt: expect.any(Number) }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].invoiceNumber).toBe("INV-001");
    expect(result[0].clientName).toBe("Client One");
    expect(result[0].linkedOrderNumber).toBe("ORD-001");
    expect(result[0].linkedOrderStatus).toBe("confirmed");
  });

  it("returns empty array when supplier has no orders", async () => {
    vi.mocked(getOrdersContainingSupplierProducts).mockResolvedValue([]);

    const result = await getInvoicesForSupplierId("supplier-empty");

    expect(getInvoicesByOrderIds).not.toHaveBeenCalled();
    expect(result).toEqual([]);
    expect(setCache).toHaveBeenCalledWith(
      'invoices:list:v2:{"supplierId":"supplier-empty"}',
      [],
      300,
      expect.objectContaining({ fetchedAt: expect.any(Number) }),
    );
  });

  it("returns cached result without querying orders", async () => {
    const cached = [{ id: "cached-inv", invoiceNumber: "INV-CACHED" }];
    vi.mocked(getCache).mockResolvedValue(cached as never);

    const result = await getInvoicesForSupplierId("supplier-cached");

    expect(result).toBe(cached);
    expect(getOrdersContainingSupplierProducts).not.toHaveBeenCalled();
    expect(getInvoicesByOrderIds).not.toHaveBeenCalled();
  });
});
