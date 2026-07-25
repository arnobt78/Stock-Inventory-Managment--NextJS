import { describe, expect, it } from "vitest";
import {
  getOrderAmountPaidForDestructiveCopy,
  getOrderCancelConfirmDescription,
  getOrderRefundConfirmDescription,
} from "./order-destructive-copy";

describe("getOrderAmountPaidForDestructiveCopy", () => {
  it("prefers invoice amountPaid", () => {
    expect(
      getOrderAmountPaidForDestructiveCopy({
        total: 100,
        amountPaid: 10,
        invoiceForOrder: { amountPaid: 40 } as never,
      }),
    ).toBe(40);
  });
});

describe("getOrderCancelConfirmDescription", () => {
  it("mentions refund for partial", () => {
    const text = getOrderCancelConfirmDescription({
      orderNumber: "ORD-1",
      paymentStatus: "partial",
      total: 100,
      invoiceForOrder: { amountPaid: 25 } as never,
    });
    expect(text).toContain("ORD-1");
    expect(text).toContain("$25.00");
    expect(text).toContain("refund");
  });

  it("simple cancel for unpaid", () => {
    const text = getOrderCancelConfirmDescription({
      orderNumber: "ORD-2",
      paymentStatus: "unpaid",
      total: 100,
    });
    expect(text).toContain("cancel order ORD-2");
    expect(text).not.toContain("refund");
  });
});

describe("getOrderRefundConfirmDescription", () => {
  it("includes refund amount", () => {
    const text = getOrderRefundConfirmDescription({
      orderNumber: "ORD-3",
      total: 3980,
      invoiceForOrder: { amountPaid: 3980 } as never,
    });
    expect(text).toContain("$3980.00");
    expect(text).toContain("Stripe");
  });
});
