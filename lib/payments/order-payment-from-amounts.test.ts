import { describe, expect, it } from "vitest";
import {
  applyIncrementalInvoicePayment,
  resolveInvoiceStatusAfterMoney,
  deriveOrderPaymentStatus,
  shouldConfirmAndFulfillOnPaymentSync,
} from "./order-payment-from-amounts";

describe("deriveOrderPaymentStatus", () => {
  it("returns unpaid when paid is 0", () => {
    expect(deriveOrderPaymentStatus(0, 3980)).toBe("unpaid");
  });

  it("returns unpaid when total is 0", () => {
    expect(deriveOrderPaymentStatus(0, 0)).toBe("unpaid");
  });

  it("returns partial for mid payment", () => {
    expect(deriveOrderPaymentStatus(100, 3980)).toBe("partial");
  });

  it("returns paid when paid equals total", () => {
    expect(deriveOrderPaymentStatus(3980, 3980)).toBe("paid");
  });

  it("returns paid when paid exceeds total", () => {
    expect(deriveOrderPaymentStatus(4000, 3980)).toBe("paid");
  });

  // REQ-0215 — cent-safe: float noise near total still paid
  it("returns paid for float-near-total amounts", () => {
    expect(deriveOrderPaymentStatus(1880.06, 1880.06)).toBe("paid");
    expect(deriveOrderPaymentStatus(1000 + 880.06, 1880.06)).toBe("paid");
  });
});

describe("shouldConfirmAndFulfillOnPaymentSync", () => {
  it("confirms+fulfills on first partial while pending", () => {
    expect(
      shouldConfirmAndFulfillOnPaymentSync({
        derived: "partial",
        orderStatus: "pending",
      }),
    ).toBe(true);
  });

  it("confirms+fulfills on full paid while pending", () => {
    expect(
      shouldConfirmAndFulfillOnPaymentSync({
        derived: "paid",
        orderStatus: "pending",
      }),
    ).toBe(true);
  });

  it("does not fulfill again when already confirmed (partial → paid)", () => {
    expect(
      shouldConfirmAndFulfillOnPaymentSync({
        derived: "paid",
        orderStatus: "confirmed",
      }),
    ).toBe(false);
  });

  it("does not bump shipped/delivered/cancelled", () => {
    expect(
      shouldConfirmAndFulfillOnPaymentSync({
        derived: "partial",
        orderStatus: "shipped",
      }),
    ).toBe(false);
    expect(
      shouldConfirmAndFulfillOnPaymentSync({
        derived: "paid",
        orderStatus: "cancelled",
      }),
    ).toBe(false);
  });

  it("does not confirm unpaid", () => {
    expect(
      shouldConfirmAndFulfillOnPaymentSync({
        derived: "unpaid",
        orderStatus: "pending",
      }),
    ).toBe(false);
  });
});

describe("applyIncrementalInvoicePayment", () => {
  it("accumulates partial charges", () => {
    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: 100,
      total: 3980,
      chargeAmount: 500,
      priorStatus: "sent",
    });
    expect(next.amountPaid).toBe(600);
    expect(next.amountDue).toBe(3380);
    expect(next.fullyPaid).toBe(false);
    expect(next.status).toBe("sent");
  });

  it("marks paid when charge completes balance", () => {
    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: 3880,
      total: 3980,
      chargeAmount: 100,
      priorStatus: "sent",
    });
    expect(next.amountPaid).toBe(3980);
    expect(next.amountDue).toBe(0);
    expect(next.fullyPaid).toBe(true);
    expect(next.status).toBe("paid");
  });

  it("downgrades paid status when somehow still mid (defensive)", () => {
    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: 0,
      total: 1000,
      chargeAmount: 100,
      priorStatus: "paid",
    });
    expect(next.fullyPaid).toBe(false);
    expect(next.status).toBe("sent");
  });

  it("promotes draft to sent on first money", () => {
    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: 0,
      total: 178.12,
      chargeAmount: 100,
      priorStatus: "draft",
    });
    expect(next.status).toBe("sent");
    expect(next.amountDue).toBeCloseTo(78.12, 2);
  });

  it("resolveInvoiceStatusAfterMoney heals draft when paid already applied", () => {
    expect(
      resolveInvoiceStatusAfterMoney({
        status: "draft",
        amountPaid: 100,
        total: 389.22,
      }),
    ).toBe("sent");
  });

  // REQ-0215 — remainder settle: sent + full money → paid, amountDue 0
  it("marks paid when remainder charge settles sent invoice", () => {
    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: 1000,
      total: 1880.06,
      chargeAmount: 880.06,
      priorStatus: "sent",
    });
    expect(next.fullyPaid).toBe(true);
    expect(next.status).toBe("paid");
    expect(next.amountDue).toBe(0);
    expect(next.amountPaid).toBe(1880.06);
  });

  it("resolveInvoiceStatusAfterMoney promotes sent to paid when settled", () => {
    expect(
      resolveInvoiceStatusAfterMoney({
        status: "sent",
        amountPaid: 1880.06,
        total: 1880.06,
      }),
    ).toBe("paid");
  });

  it("resolveInvoiceStatusAfterMoney promotes overdue to paid when settled", () => {
    expect(
      resolveInvoiceStatusAfterMoney({
        status: "overdue",
        amountPaid: 50,
        total: 50,
      }),
    ).toBe("paid");
  });
});
