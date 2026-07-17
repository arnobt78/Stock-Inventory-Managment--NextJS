import { describe, expect, it } from "vitest";
import { updateInvoiceSchema } from "./invoice";

describe("updateInvoiceSchema", () => {
  it("accepts date-only sentAt/paidAt/cancelledAt (REQ-0151 DialogDateField)", () => {
    const parsed = updateInvoiceSchema.safeParse({
      id: "inv-1",
      status: "sent",
      sentAt: "2026-07-15",
      paidAt: "",
      cancelledAt: "",
      dueDate: "2026-08-14",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts ISO datetime timestamps", () => {
    const parsed = updateInvoiceSchema.safeParse({
      id: "inv-1",
      status: "paid",
      paidAt: "2026-06-15T18:00:00.000Z",
      sentAt: "2026-06-01T12:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });
});
