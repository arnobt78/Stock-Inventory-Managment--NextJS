import { describe, expect, it } from "vitest";
import {
  resolveInvoiceBillingAddressForDisplay,
  resolveInvoiceBillingAddressInput,
} from "./resolve-invoice-billing-address";

describe("resolveInvoiceBillingAddress (REQ-0210)", () => {
  const shipping = {
    street: "Riedstraße 2",
    city: "Frankfurt",
    state: "HE",
    zipCode: "60388",
    country: "Germany",
  };
  const billing = {
    street: "Billing St",
    city: "Berlin",
    state: "BE",
    zipCode: "10115",
    country: "Germany",
  };

  it("prefers billing over shipping for Prisma input", () => {
    expect(
      resolveInvoiceBillingAddressInput({
        billingAddress: billing,
        shippingAddress: shipping,
      }),
    ).toEqual(billing);
  });

  it("falls back to shipping when billing missing", () => {
    expect(
      resolveInvoiceBillingAddressInput({
        billingAddress: null,
        shippingAddress: shipping,
      }),
    ).toEqual(shipping);
  });

  it("display prefers invoice billing then order shipping", () => {
    expect(
      resolveInvoiceBillingAddressForDisplay(null, {
        billingAddress: null,
        shippingAddress: shipping,
      }),
    ).toEqual(shipping);
    expect(
      resolveInvoiceBillingAddressForDisplay(billing, {
        shippingAddress: shipping,
      }),
    ).toEqual(billing);
  });
});
