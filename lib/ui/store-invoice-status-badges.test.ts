import { describe, expect, it } from "vitest";
import { buildStoreInvoiceStatusBadges } from "./store-invoice-status-badges";

describe("buildStoreInvoiceStatusBadges", () => {
  it("returns Paid → Partial → Pending → Overdue → Cancelled → Refunded", () => {
    const badges = buildStoreInvoiceStatusBadges({
      paidCount: 1,
      partialCount: 1,
      pendingCount: 0,
      overdueCount: 0,
      cancelledCount: 0,
      refundedCount: 0,
    });
    expect(badges.map((b) => b.label)).toEqual([
      "Paid",
      "Partial",
      "Pending",
      "Overdue",
      "Cancelled",
      "Refunded",
    ]);
    expect(badges.find((b) => b.label === "Paid")?.value).toBe(1);
    expect(badges.find((b) => b.label === "Partial")?.value).toBe(1);
  });

  it("appends Self/Others when provided", () => {
    const badges = buildStoreInvoiceStatusBadges({
      paidCount: 1,
      selfOthers: { invoiceSelfCount: 2, invoiceOthersCount: 0 },
    });
    expect(badges.at(-2)).toEqual({ label: "Self", value: 2 });
    expect(badges.at(-1)).toEqual({ label: "Others", value: 0 });
  });
});
