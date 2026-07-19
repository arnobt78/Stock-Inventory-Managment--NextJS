import { describe, expect, it } from "vitest";
import {
  getUserOverviewDescription,
  isStoreOwnerOverviewRole,
  shouldShowMyActivityTip,
} from "./user-overview-copy";

describe("user-overview-copy", () => {
  it("isStoreOwnerOverviewRole for admin/user only", () => {
    expect(isStoreOwnerOverviewRole("admin")).toBe(true);
    expect(isStoreOwnerOverviewRole("user")).toBe(true);
    expect(isStoreOwnerOverviewRole("client")).toBe(false);
    expect(isStoreOwnerOverviewRole("supplier")).toBe(false);
    expect(isStoreOwnerOverviewRole(null)).toBe(false);
  });

  it("getUserOverviewDescription is role-aware and short", () => {
    expect(getUserOverviewDescription("admin")).toMatch(/Store-owner/);
    expect(getUserOverviewDescription("admin")).not.toMatch(/userId/);
    expect(getUserOverviewDescription("client")).toMatch(/Buyer/);
    expect(getUserOverviewDescription("supplier")).toMatch(/Supplier/);
    expect(getUserOverviewDescription(null)).toMatch(/linked to this user/);
  });

  it("shouldShowMyActivityTip only for own store-owner account", () => {
    expect(
      shouldShowMyActivityTip({ isOwner: true, role: "admin" }),
    ).toBe(true);
    expect(
      shouldShowMyActivityTip({ isOwner: true, role: "user" }),
    ).toBe(true);
    expect(
      shouldShowMyActivityTip({ isOwner: false, role: "admin" }),
    ).toBe(false);
    expect(
      shouldShowMyActivityTip({ isOwner: true, role: "client" }),
    ).toBe(false);
  });
});
