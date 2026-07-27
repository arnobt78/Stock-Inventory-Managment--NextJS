import { describe, expect, it } from "vitest";
import {
  resolveOrderStatusAt,
  resolveOrderStatusAtFromSource,
  withOrderStatusAt,
} from "./order-status-display-date";

describe("resolveOrderStatusAt", () => {
  it("returns updatedAt for paid paymentStatus when paidAt absent", () => {
    expect(
      resolveOrderStatusAt({
        paymentStatus: "paid",
        updatedAt: "2026-07-15T12:00:00.000Z",
      }),
    ).toBe("2026-07-15T12:00:00.000Z");
  });

  it("prefers invoice paidAt over updatedAt for paid orders", () => {
    expect(
      resolveOrderStatusAtFromSource({
        paymentStatus: "paid",
        updatedAt: "2026-07-15T12:00:00.000Z",
        invoice: { paidAt: "2026-07-10T08:30:00.000Z" },
      }),
    ).toBe("2026-07-10T08:30:00.000Z");
  });

  it("returns cancelledAt for cancelled orders", () => {
    expect(
      resolveOrderStatusAt({
        status: "cancelled",
        cancelledAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toBe("2026-07-14T12:00:00.000Z");
  });

  it("returns undefined for pending without updatedAt", () => {
    expect(resolveOrderStatusAt({ status: "pending" })).toBeUndefined();
  });

  it("returns updatedAt for confirmed / processing / pending", () => {
    const at = "2026-07-27T12:00:00.000Z";
    expect(
      resolveOrderStatusAt({ status: "confirmed", updatedAt: at }),
    ).toBe(at);
    expect(
      resolveOrderStatusAt({ status: "processing", updatedAt: at }),
    ).toBe(at);
    expect(resolveOrderStatusAt({ status: "pending", updatedAt: at })).toBe(at);
  });

  it("falls back to updatedAt for shipped when shippedAt missing", () => {
    const at = "2026-07-27T13:00:00.000Z";
    expect(resolveOrderStatusAt({ status: "shipped", updatedAt: at })).toBe(at);
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

  it("withOrderStatusAt strips nested invoice from output", () => {
    expect(
      withOrderStatusAt({
        id: "o3",
        paymentStatus: "paid",
        updatedAt: "2026-07-15T12:00:00.000Z",
        invoice: { paidAt: "2026-07-10T08:30:00.000Z" },
      }),
    ).toEqual({
      id: "o3",
      paymentStatus: "paid",
      updatedAt: "2026-07-15T12:00:00.000Z",
      statusAt: "2026-07-10T08:30:00.000Z",
    });
  });
});
