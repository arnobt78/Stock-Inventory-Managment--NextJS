import { describe, expect, it } from "vitest";
import {
  buildPaymentMoneyStats,
  isPartialPayInvoice,
} from "./payment-money-stats";

/** Demo fixture: INV-DEMO-001 paid $534.93 + INV-DEMO-002 partial $100 / due $3880 */
const DEMO_INVOICES = [
  {
    status: "paid",
    amountPaid: 534.93,
    amountDue: 0,
    total: 534.93,
  },
  {
    status: "sent",
    amountPaid: 100,
    amountDue: 3880,
    total: 3980,
  },
];

describe("buildPaymentMoneyStats", () => {
  it("partitions demo partial + paid invoices", () => {
    const s = buildPaymentMoneyStats(DEMO_INVOICES);
    expect(s.paidCollected).toBeCloseTo(534.93, 2);
    expect(s.partialCollected).toBeCloseTo(100, 2);
    expect(s.dueOutstanding).toBeCloseTo(3880, 2);
    expect(s.pendingUnpaidDue).toBe(0);
    expect(s.paidInvoiceCount).toBe(1);
    expect(s.partialInvoiceCount).toBe(1);
    expect(s.pendingInvoiceCount).toBe(0);
    // Paid + Partial + Due = Total Revenue story
    expect(s.paidCollected + s.partialCollected + s.dueOutstanding).toBeCloseTo(
      4514.93,
      2,
    );
  });

  it("counts fully unpaid sent as pending", () => {
    const s = buildPaymentMoneyStats([
      {
        status: "sent",
        amountPaid: 0,
        amountDue: 200,
        total: 200,
      },
    ]);
    expect(s.pendingUnpaidDue).toBe(200);
    expect(s.pendingInvoiceCount).toBe(1);
    expect(s.partialInvoiceCount).toBe(0);
    expect(s.dueOutstanding).toBe(200);
  });

  it("skips cancelled invoices", () => {
    const s = buildPaymentMoneyStats([
      {
        status: "cancelled",
        amountPaid: 50,
        amountDue: 50,
        total: 100,
      },
    ]);
    expect(s.paidCollected).toBe(0);
    expect(s.partialCollected).toBe(0);
    expect(s.dueOutstanding).toBe(0);
  });
});

describe("isPartialPayInvoice", () => {
  it("detects mid-pay", () => {
    expect(
      isPartialPayInvoice({ amountPaid: 100, amountDue: 3880, status: "sent" }),
    ).toBe(true);
  });

  it("rejects fully paid", () => {
    expect(
      isPartialPayInvoice({ amountPaid: 100, amountDue: 0, status: "paid" }),
    ).toBe(false);
  });
});
