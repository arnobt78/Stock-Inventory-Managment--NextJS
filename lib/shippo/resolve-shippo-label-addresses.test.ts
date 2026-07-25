import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEST_TO_ADDRESS,
  resolveShippoLabelAddresses,
  selectShippoRateForLabel,
} from "./server";

describe("resolveShippoLabelAddresses (REQ-0211)", () => {
  it("test mode ignores order shipping and uses DEFAULT_TEST_TO", () => {
    const { addressTo } = resolveShippoLabelAddresses({
      testMode: true,
      orderShipping: {
        street: "Riedstraße 2",
        city: "Frankfurt",
        state: "HE",
        zipCode: "60388",
        country: "Germany",
      },
      toFromRequest: { city: "Berlin", country: "DE" },
    });
    expect(addressTo).toEqual(DEFAULT_TEST_TO_ADDRESS);
  });

  it("live mode uses order shipping", () => {
    const { addressTo } = resolveShippoLabelAddresses({
      testMode: false,
      orderShipping: {
        name: "Buyer",
        street: "42 Explore Lane",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        country: "US",
      },
    });
    expect(addressTo.city).toBe("Austin");
    expect(addressTo.zip).toBe("78701");
  });
});

describe("selectShippoRateForLabel (REQ-0211)", () => {
  const rates = [
    { provider: "UPS", amount: "12.00", servicelevel: { token: "ups_ground" } },
    { provider: "USPS", amount: "5.00", servicelevel: { token: "priority" } },
  ];

  it("test mode prefers USPS even when UPS selected", () => {
    const picked = selectShippoRateForLabel(rates, "ups", { testMode: true });
    expect(picked?.provider).toBe("USPS");
  });

  it("live mode honors preferred carrier when present", () => {
    const picked = selectShippoRateForLabel(rates, "ups", { testMode: false });
    expect(picked?.provider).toBe("UPS");
  });
});
