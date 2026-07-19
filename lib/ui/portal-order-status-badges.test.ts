import { describe, expect, it } from "vitest";
import { buildPortalOrderStatusBadges } from "./portal-order-status-badges";

describe("buildPortalOrderStatusBadges", () => {
  it("builds Pending → In progress → Shipping → Delivered", () => {
    const badges = buildPortalOrderStatusBadges({
      pending: 1,
      inProgress: 2,
      shipped: 3,
      delivered: 4,
    });
    expect(badges.map((b) => b.label)).toEqual([
      "Pending",
      "In progress",
      "Shipping",
      "Delivered",
    ]);
    expect(badges.map((b) => b.value)).toEqual([1, 2, 3, 4]);
  });

  it("appends Refunded and Cancelled only when defined", () => {
    const withBoth = buildPortalOrderStatusBadges({
      pending: 0,
      inProgress: 0,
      shipped: 0,
      delivered: 1,
      refundedCount: 2,
      cancelledCount: 3,
    });
    expect(withBoth.map((b) => b.label)).toEqual([
      "Pending",
      "In progress",
      "Shipping",
      "Delivered",
      "Refunded",
      "Cancelled",
    ]);
    expect(withBoth.at(-2)?.value).toBe(2);
    expect(withBoth.at(-1)?.value).toBe(3);

    const refundOnly = buildPortalOrderStatusBadges({
      pending: 0,
      inProgress: 0,
      shipped: 0,
      delivered: 0,
      refundedCount: 0,
    });
    expect(refundOnly.map((b) => b.label)).toEqual([
      "Pending",
      "In progress",
      "Shipping",
      "Delivered",
      "Refunded",
    ]);
  });
});
