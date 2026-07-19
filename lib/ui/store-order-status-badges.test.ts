import { describe, expect, it } from "vitest";
import { buildStoreOrderStatusBadges } from "./store-order-status-badges";

describe("buildStoreOrderStatusBadges", () => {
  it("includes Delivered and buckets Shipping as processing+shipped", () => {
    const badges = buildStoreOrderStatusBadges({
      statusDistribution: {
        pending: 0,
        confirmed: 1,
        processing: 1,
        shipped: 1,
        delivered: 1,
        cancelled: 0,
      },
      refundedCount: 0,
    });

    expect(badges.map((b) => b.label)).toEqual([
      "Pending",
      "Confirmed",
      "Shipping",
      "Delivered",
      "Refund",
      "Cancel",
    ]);
    expect(badges.find((b) => b.label === "Shipping")?.value).toBe(2);
    expect(badges.find((b) => b.label === "Delivered")?.value).toBe(1);
    expect(badges.find((b) => b.label === "Confirmed")?.value).toBe(1);
  });

  it("appends Self/Others when provided", () => {
    const badges = buildStoreOrderStatusBadges({
      statusDistribution: { delivered: 1 },
      selfOthers: { orderSelfCount: 2, orderOthersCount: 0 },
    });
    expect(badges.at(-2)).toEqual({ label: "Self", value: 2 });
    expect(badges.at(-1)).toEqual({ label: "Others", value: 0 });
  });
});
