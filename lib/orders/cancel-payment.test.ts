import { describe, expect, it } from "vitest";
import { orderCancelShouldRefundPayment } from "./cancel-payment";

describe("orderCancelShouldRefundPayment", () => {
  it("refunds fully paid", () => {
    expect(orderCancelShouldRefundPayment("paid", "pending")).toBe(true);
  });

  it("refunds partial (pending + partial paid)", () => {
    expect(orderCancelShouldRefundPayment("partial", "pending")).toBe(true);
  });

  it("does not refund unpaid pending", () => {
    expect(orderCancelShouldRefundPayment("unpaid", "pending")).toBe(false);
  });

  // REQ-0211 — confirmed without money stays unpaid (not Refunded)
  it("does not refund confirmed unpaid", () => {
    expect(orderCancelShouldRefundPayment("unpaid", "confirmed")).toBe(false);
  });

  it("does not refund shipped unpaid", () => {
    expect(orderCancelShouldRefundPayment("unpaid", "shipped")).toBe(false);
  });
});
