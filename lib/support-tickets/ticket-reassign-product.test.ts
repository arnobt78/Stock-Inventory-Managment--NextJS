import { describe, expect, it } from "vitest";
import {
  resolveProductIdAfterAssigneeChange,
  willClearProductOnReassign,
} from "./ticket-reassign-product";

describe("resolveProductIdAfterAssigneeChange", () => {
  it("returns undefined when no product linked", () => {
    expect(
      resolveProductIdAfterAssigneeChange(
        { productId: null, productOwnerUserId: null },
        "owner-2",
      ),
    ).toBeUndefined();
  });

  it("keeps product when owner matches next assignee", () => {
    expect(
      resolveProductIdAfterAssigneeChange(
        { productId: "prod-1", productOwnerUserId: "owner-2" },
        "owner-2",
      ),
    ).toBe("prod-1");
  });

  it("clears when next assignee mismatches product owner", () => {
    expect(
      resolveProductIdAfterAssigneeChange(
        { productId: "prod-1", productOwnerUserId: "owner-1" },
        "owner-2",
      ),
    ).toBeNull();
  });

  it("clears when assignee cleared", () => {
    expect(
      resolveProductIdAfterAssigneeChange(
        { productId: "prod-1", productOwnerUserId: "owner-1" },
        null,
      ),
    ).toBeNull();
  });

  it("clears when product owner unknown", () => {
    expect(
      resolveProductIdAfterAssigneeChange(
        { productId: "prod-1", productOwnerUserId: null },
        "owner-1",
      ),
    ).toBeNull();
  });
});

describe("willClearProductOnReassign", () => {
  it("true on mismatch", () => {
    expect(
      willClearProductOnReassign(
        { productId: "prod-1", productOwnerUserId: "owner-1" },
        "owner-2",
      ),
    ).toBe(true);
  });

  it("false when keep", () => {
    expect(
      willClearProductOnReassign(
        { productId: "prod-1", productOwnerUserId: "owner-2" },
        "owner-2",
      ),
    ).toBe(false);
  });
});
