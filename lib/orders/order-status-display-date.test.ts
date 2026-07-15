import { describe, expect, it } from "vitest";
import { resolveOrderStatusAt, withOrderStatusAt } from "./order-status-display-date";

describe("resolveOrderStatusAt", () => {
  it("returns updatedAt for paid paymentStatus when paidAt absent", () => {
    expect(
      resolveOrderStatusAt({
        paymentStatus: "paid",
        updatedAt: "2026-07-15T12:00:00.000Z",
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

  it("withOrderStatusAt attaches statusAt when resolved", () => {
    expect(
      withOrderStatusAt({
        id: "o1",
        status: "delivered",
        deliveredAt: "2026-07-13T10:00:00.000Z",
      }),
    ).toEqual({
      id: "o1",
      status: "delivered",
      deliveredAt: "2026-07-13T10:00:00.000Z",
      statusAt: "2026-07-13T10:00:00.000Z",
    });
  });

  it("withOrderStatusAt omits statusAt key when unresolved", () => {
    expect(withOrderStatusAt({ id: "o2", status: "pending" })).toEqual({
      id: "o2",
      status: "pending",
    });
  });
});
