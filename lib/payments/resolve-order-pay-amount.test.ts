import { describe, expect, it } from "vitest";
import { resolveOrderPayAmount } from "./resolve-order-pay-amount";

describe("resolveOrderPayAmount (REQ-0210)", () => {
  it("uses positive invoice amountDue", () => {
    expect(
      resolveOrderPayAmount({
        total: 389.22,
        invoiceForOrder: { amountDue: 289.22, amountPaid: 100, total: 389.22 },
      }),
    ).toBe(289.22);
  });

  it("recomputes when amountDue is 0 but paid < total", () => {
    expect(
      resolveOrderPayAmount({
        total: 389.22,
        invoiceForOrder: { amountDue: 0, amountPaid: 100, total: 389.22 },
      }),
    ).toBeCloseTo(289.22, 2);
  });

  it("returns 0 when fully paid or closed", () => {
    expect(
      resolveOrderPayAmount({
        total: 178.12,
        invoiceForOrder: { amountDue: 0, amountPaid: 178.12, total: 178.12 },
      }),
    ).toBe(0);
  });
});
