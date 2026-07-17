import { describe, expect, it } from "vitest";
import {
  invoiceStatusAtSemanticKind,
  resolveInvoiceStatusAt,
} from "./invoice-status-display-date";

describe("resolveInvoiceStatusAt", () => {
  it("uses paidAt when paid", () => {
    expect(
      resolveInvoiceStatusAt({
        status: "paid",
        paidAt: "2026-06-15T18:00:00.000Z",
        dueDate: "2026-07-15T00:00:00.000Z",
      }),
    ).toBe("2026-06-15T18:00:00.000Z");
  });

  it("uses cancelledAt when cancelled", () => {
    expect(
      resolveInvoiceStatusAt({
        status: "cancelled",
        cancelledAt: "2026-06-10T12:00:00.000Z",
      }),
    ).toBe("2026-06-10T12:00:00.000Z");
  });

  it("uses sentAt when sent", () => {
    expect(
      resolveInvoiceStatusAt({
        status: "sent",
        sentAt: "2026-07-15T12:00:00.000Z",
        dueDate: "2026-08-14T00:00:00.000Z",
      }),
    ).toBe("2026-07-15T12:00:00.000Z");
  });

  it("falls back to issuedAt for draft", () => {
    expect(
      resolveInvoiceStatusAt({
        status: "draft",
        issuedAt: "2026-07-01T00:00:00.000Z",
        createdAt: "2026-06-30T00:00:00.000Z",
      }),
    ).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("invoiceStatusAtSemanticKind", () => {
  it("maps invoice statuses", () => {
    expect(invoiceStatusAtSemanticKind("paid")).toBe("paid");
    expect(invoiceStatusAtSemanticKind("sent")).toBe("sent");
    expect(invoiceStatusAtSemanticKind("overdue")).toBe("overdue");
    expect(invoiceStatusAtSemanticKind("draft")).toBe("created");
  });
});
