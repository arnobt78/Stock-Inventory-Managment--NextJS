/**
 * REQ-0204 — supplier invoice detail access via getInvoiceDetailForPage.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/prisma/supplier", () => ({
  getSupplierByUserId: vi.fn(),
}));

vi.mock("@/prisma/invoice", () => ({
  getInvoiceById: vi.fn(),
  getInvoiceByIdForProductOwner: vi.fn(),
  getInvoiceByIdForSupplier: vi.fn(),
}));

vi.mock("@/prisma/client", () => ({
  prisma: {
    invoice: { findUnique: vi.fn(), findFirst: vi.fn() },
    order: { findUnique: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/orders/enrich-order-items-catalog", () => ({
  enrichOrderItemsCatalogNames: vi.fn(async (items: unknown) => items),
}));

vi.mock("@/lib/invoices/transform-invoice-detail", () => ({
  transformInvoiceDetail: vi.fn((_inv, _enrich) => ({
    id: "inv-1",
    invoiceNumber: "INV-1",
  })),
}));

import { getSupplierByUserId } from "@/prisma/supplier";
import { getInvoiceByIdForSupplier } from "@/prisma/invoice";
import { prisma } from "@/prisma/client";
import { getInvoiceDetailForPage } from "./invoice-detail-data";

describe("getInvoiceDetailForPage supplier (REQ-0204)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
  });

  it("allows supplier when invoice order contains their products", async () => {
    vi.mocked(getSupplierByUserId).mockResolvedValue({
      id: "sup-entity-1",
    } as Awaited<ReturnType<typeof getSupplierByUserId>>);
    vi.mocked(getInvoiceByIdForSupplier).mockResolvedValue({
      id: "inv-1",
      orderId: "ord-1",
      invoiceNumber: "INV-1",
      userId: "owner-1",
      clientId: "client-1",
      status: "sent",
      subtotal: 100,
      total: 100,
      amountPaid: 0,
      amountDue: 100,
      tax: 0,
      shipping: 0,
      discount: 0,
      issuedAt: new Date(),
      dueDate: new Date(),
      paidAt: null,
      sentAt: null,
      cancelledAt: null,
      refundedAt: null,
      createdAt: new Date(),
      updatedAt: null,
      createdBy: "owner-1",
      updatedBy: null,
      billingAddress: null,
      notes: null,
    } as never);

    const result = await getInvoiceDetailForPage(
      { id: "supplier-user-1", role: "supplier" },
      "inv-1",
    );

    expect(getSupplierByUserId).toHaveBeenCalledWith("supplier-user-1");
    expect(getInvoiceByIdForSupplier).toHaveBeenCalledWith(
      "inv-1",
      "sup-entity-1",
    );
    expect(result).toEqual({ id: "inv-1", invoiceNumber: "INV-1" });
  });

  it("denies supplier when invoice is unrelated", async () => {
    vi.mocked(getSupplierByUserId).mockResolvedValue({
      id: "sup-entity-1",
    } as Awaited<ReturnType<typeof getSupplierByUserId>>);
    vi.mocked(getInvoiceByIdForSupplier).mockResolvedValue(null);

    const result = await getInvoiceDetailForPage(
      { id: "supplier-user-1", role: "supplier" },
      "inv-other",
    );

    expect(result).toBeNull();
  });

  it("denies supplier with no supplier entity", async () => {
    vi.mocked(getSupplierByUserId).mockResolvedValue(null);

    const result = await getInvoiceDetailForPage(
      { id: "supplier-user-1", role: "supplier" },
      "inv-1",
    );

    expect(getInvoiceByIdForSupplier).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
