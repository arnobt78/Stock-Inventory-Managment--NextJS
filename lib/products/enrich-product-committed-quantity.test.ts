/**
 * REQ-0103 — committed quantity enrichment tests.
 */

import { describe, expect, it } from "vitest";
import {
  computeCommittedQuantity,
  getDisplayCommittedQuantity,
  withCommittedQuantity,
} from "./enrich-product-committed-quantity";

describe("enrich-product-committed-quantity", () => {
  it("computeCommittedQuantity sums disjoint paths", () => {
    expect(computeCommittedQuantity(0, 20)).toBe(20);
    expect(computeCommittedQuantity(5, 3)).toBe(8);
  });

  it("withCommittedQuantity adds display field without mutating reservedQuantity", () => {
    const row = withCommittedQuantity(
      { id: "p1", reservedQuantity: 0 },
      20,
    );
    expect(row.reservedQuantity).toBe(0);
    expect(row.committedQuantity).toBe(20);
  });

  it("getDisplayCommittedQuantity prefers committedQuantity", () => {
    expect(
      getDisplayCommittedQuantity({ reservedQuantity: 0, committedQuantity: 20 }),
    ).toBe(20);
    expect(getDisplayCommittedQuantity({ reservedQuantity: 5 })).toBe(5);
  });

  it("REQ-0104 warehouse pick: committed is allocation sum when product reserved is 0", () => {
    expect(computeCommittedQuantity(0, 20)).toBe(20);
    expect(computeCommittedQuantity(0, 20)).not.toBe(40);
  });
});
