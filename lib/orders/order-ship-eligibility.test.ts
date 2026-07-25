import { describe, expect, it } from "vitest";
import {
  canGenerateShippingLabel,
  shippingLabelBlockedReason,
} from "./order-ship-eligibility";

describe("canGenerateShippingLabel (REQ-0211)", () => {
  it("blocks pending unpaid", () => {
    expect(
      canGenerateShippingLabel({
        status: "pending",
        paymentStatus: "unpaid",
      }),
    ).toBe(false);
    expect(
      shippingLabelBlockedReason({
        status: "pending",
        paymentStatus: "unpaid",
      }),
    ).toMatch(/Confirm the order/);
  });

  it("allows confirmed unpaid and partial", () => {
    expect(
      canGenerateShippingLabel({
        status: "confirmed",
        paymentStatus: "unpaid",
      }),
    ).toBe(true);
    expect(
      canGenerateShippingLabel({
        status: "pending",
        paymentStatus: "partial",
      }),
    ).toBe(true);
  });
});
