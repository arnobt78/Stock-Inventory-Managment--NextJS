import { describe, expect, it } from "vitest";
import { transformInvoiceDetail } from "@/lib/invoices/transform-invoice-detail";

const baseInvoice = {
  id: "inv1",
  invoiceNumber: "INV-100",
  orderId: "ord1",
  userId: "user1",
  clientId: "client1",
  status: "sent",
  subtotal: 100,
  tax: 10,
  shipping: 5,
  discount: 0,
  total: 115,
  amountPaid: 0,
  amountDue: 115,
  dueDate: new Date("2026-02-01"),
  issuedAt: new Date("2026-01-20"),
  sentAt: null,
  paidAt: null,
  cancelledAt: null,
  paymentLink: null,
  notes: null,
  billingAddress: null,
  createdAt: new Date("2026-01-20"),
  updatedAt: null,
  createdBy: "admin1",
  updatedBy: null,
};

describe("transformInvoiceDetail", () => {
  it("passes linkedOrderNumber and linkedOrderItems from enrichment", () => {
    const result = transformInvoiceDetail(baseInvoice, {
      invoiceCreatedBy: { name: "Admin", email: "admin@test.com" },
      orderedBy: { name: "Client", email: "client@test.com" },
      client: { name: "Client", email: "client@test.com" },
      invoiceProductOwners: [],
      linkedOrderNumber: "ORD-42",
      linkedOrderItems: [
        {
          id: "item1",
          orderId: "ord1",
          productId: "prod1",
          productName: "Widget",
          sku: "W-1",
          quantity: 1,
          price: 100,
          subtotal: 100,
          createdAt: "2026-01-15T10:00:00.000Z",
          imageUrl: "https://example.com/w.jpg",
          categoryId: null,
          supplierId: null,
        },
      ],
    });

    expect(result.linkedOrderNumber).toBe("ORD-42");
    expect(result.linkedOrderItems).toHaveLength(1);
    expect(result.linkedOrderItems![0].productName).toBe("Widget");
    expect(result.linkedOrderItems![0].imageUrl).toBe("https://example.com/w.jpg");
  });
});
