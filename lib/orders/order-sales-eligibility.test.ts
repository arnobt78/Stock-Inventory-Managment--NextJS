import { describe, expect, it } from "vitest";
import {
  isOrderCountedAsSold,
  isOrderRecordCountedAsSold,
} from "@/lib/orders/order-sales-eligibility";

describe("isOrderCountedAsSold (REQ-0140)", () => {
  it("counts delivered or paid", () => {
    expect(isOrderCountedAsSold("delivered", "unpaid")).toBe(true);
    expect(isOrderCountedAsSold("pending", "paid")).toBe(true);
    expect(isOrderCountedAsSold("confirmed", "paid")).toBe(true);
  });

  it("excludes pending unpaid and cancelled/refund", () => {
    expect(isOrderCountedAsSold("pending", "unpaid")).toBe(false);
    expect(isOrderCountedAsSold("cancelled", "paid")).toBe(false);
    expect(isOrderCountedAsSold("delivered", "refunded")).toBe(false);
    expect(isOrderCountedAsSold("refund", "paid")).toBe(false);
  });

  it("isOrderRecordCountedAsSold mirrors fields", () => {
    expect(
      isOrderRecordCountedAsSold({ status: "delivered", paymentStatus: "paid" }),
    ).toBe(true);
    expect(
      isOrderRecordCountedAsSold({ status: "pending", paymentStatus: "unpaid" }),
    ).toBe(false);
    expect(isOrderRecordCountedAsSold(null)).toBe(false);
  });
});
