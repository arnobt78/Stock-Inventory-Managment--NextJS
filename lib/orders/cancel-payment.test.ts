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

  it("refunds confirmed unpaid (legacy status path)", () => {
    expect(orderCancelShouldRefundPayment("unpaid", "confirmed")).toBe(true);
  });
});
