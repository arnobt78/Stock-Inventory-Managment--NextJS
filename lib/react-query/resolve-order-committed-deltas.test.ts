/**
 * REQ-0221 — order create/fulfill/cancel → committedQuantity deltas
 */
import { describe, expect, it } from "vitest";
import { resolveOrderCommittedDeltas } from "@/lib/react-query/patch-mutation-cache";

const items = [
  { productId: "p1", quantity: 2 },
  { productId: "p2", quantity: 1 },
];

describe("resolveOrderCommittedDeltas", () => {
  it("create (no prev) reserves +qty", () => {
    expect(
      resolveOrderCommittedDeltas(null, { status: "pending", items }),
    ).toEqual([
      { productId: "p1", reservedDelta: 2 },
      { productId: "p2", reservedDelta: 1 },
    ]);
  });

  it("pending → confirmed fulfills −qty", () => {
    expect(
      resolveOrderCommittedDeltas(
        { status: "pending", paymentStatus: "unpaid", items },
        { status: "confirmed", paymentStatus: "unpaid", items },
      ),
    ).toEqual([
      { productId: "p1", reservedDelta: -2 },
      { productId: "p2", reservedDelta: -1 },
    ]);
  });

  it("pending cancel releases −qty", () => {
    expect(
      resolveOrderCommittedDeltas(
        { status: "pending", items },
        { status: "cancelled", items },
      ),
    ).toEqual([
      { productId: "p1", reservedDelta: -2 },
      { productId: "p2", reservedDelta: -1 },
    ]);
  });

  it("confirmed status change is no-op for committed", () => {
    expect(
      resolveOrderCommittedDeltas(
        { status: "confirmed", paymentStatus: "unpaid", items },
        { status: "shipping", paymentStatus: "unpaid", items },
      ),
    ).toEqual([]);
  });

  it("pending + unpaid → paid fulfills −qty (money settle)", () => {
    expect(
      resolveOrderCommittedDeltas(
        { status: "pending", paymentStatus: "unpaid", items },
        { status: "pending", paymentStatus: "paid", items },
      ),
    ).toEqual([
      { productId: "p1", reservedDelta: -2 },
      { productId: "p2", reservedDelta: -1 },
    ]);
  });

  it("already paid while pending is no-op (idempotent settle)", () => {
    expect(
      resolveOrderCommittedDeltas(
        { status: "pending", paymentStatus: "paid", items },
        { status: "pending", paymentStatus: "paid", items },
      ),
    ).toEqual([]);
  });
});
