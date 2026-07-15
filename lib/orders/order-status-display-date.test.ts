import { describe, expect, it } from "vitest";
import { resolveOrderStatusAt } from "./order-status-display-date";

describe("resolveOrderStatusAt", () => {
  it("returns paidAt for paid orders", () => {
    expect(
      resolveOrderStatusAt({
        status: "paid",
        paidAt: "2026-07-15T12:00:00.000Z",
      }),
    ).toBe("2026-07-15T12:00:00.000Z");
  });

  it("returns cancelledAt for cancelled orders", () => {
    expect(
      resolveOrderStatusAt({
        status: "cancelled",
        cancelledAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toBe("2026-07-14T12:00:00.000Z");
  });

  it("returns undefined for pending without terminal dates", () => {
    expect(resolveOrderStatusAt({ status: "pending" })).toBeUndefined();
  });
});
