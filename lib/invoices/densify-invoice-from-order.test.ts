import { describe, expect, it } from "vitest";
import { densifyInvoiceFromOrder } from "./densify-invoice-from-order";
import type { Invoice, Order } from "@/types";

describe("densifyInvoiceFromOrder (REQ-0211)", () => {
  it("fills linked order fields from order cache", () => {
    const invoice = {
      id: "i1",
      orderId: "o1",
      invoiceNumber: "INV-1",
      status: "draft",
    } as Invoice;
    const order = {
      id: "o1",
      orderNumber: "ORD-1",
      status: "pending",
      paymentStatus: "unpaid",
      userId: "u1",
      createdAt: "2026-07-25T10:00:00.000Z",
      items: [{ id: "li1", productName: "TV" }],
      statusAt: "2026-07-25T10:00:00.000Z",
    } as unknown as Order;

    const next = densifyInvoiceFromOrder(invoice, order);
    expect(next.linkedOrderNumber).toBe("ORD-1");
    expect(next.linkedOrderStatus).toBe("pending");
    expect(next.linkedOrderPaymentStatus).toBe("unpaid");
    expect(next.orderUserId).toBe("u1");
    expect(next.linkedOrderItems?.[0]?.productName).toBe("TV");
  });

  it("keeps API densify when already present", () => {
    const invoice = {
      id: "i1",
      orderId: "o1",
      linkedOrderNumber: "ORD-API",
      linkedOrderStatus: "confirmed",
    } as Invoice;
    const order = {
      id: "o1",
      orderNumber: "ORD-CACHE",
      status: "pending",
    } as Order;
    expect(densifyInvoiceFromOrder(invoice, order).linkedOrderNumber).toBe(
      "ORD-API",
    );
  });
});
