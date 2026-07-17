import { describe, expect, it } from "vitest";
import {
  createCheckoutBodySchema,
  validateCheckoutChargeAmount,
} from "./payment";

describe("createCheckoutBodySchema", () => {
  it("accepts valid checkout payload", () => {
    const result = createCheckoutBodySchema.safeParse({
      type: "order",
      id: "507f1f77bcf86cd799439011",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional positive amount (REQ-0152)", () => {
    const result = createCheckoutBodySchema.safeParse({
      type: "invoice",
      id: "507f1f77bcf86cd799439011",
      amount: 100.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive amount", () => {
    const result = createCheckoutBodySchema.safeParse({
      type: "invoice",
      id: "507f1f77bcf86cd799439011",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = createCheckoutBodySchema.safeParse({ type: "order" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createCheckoutBodySchema.safeParse({
      type: "subscription",
      id: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateCheckoutChargeAmount", () => {
  it("allows amount equal to remaining", () => {
    expect(validateCheckoutChargeAmount(3880, 3880)).toBeNull();
  });

  it("rejects amount above remaining", () => {
    expect(validateCheckoutChargeAmount(4000, 3880)).toMatch(/exceed/i);
  });

  it("rejects zero amount", () => {
    expect(validateCheckoutChargeAmount(0, 100)).toMatch(/greater/i);
  });
});
