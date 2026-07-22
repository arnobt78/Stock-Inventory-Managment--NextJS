/**
 * REQ-0206 — role portal dashboard keys stay user-scoped and distinct from admin portals.
 */
import { describe, expect, it } from "vitest";
import { queryKeys } from "./config";

describe("queryKeys.portal.*Dashboard", () => {
  const userId = "user-abc";

  it("supplierDashboard matches portal.supplier + userId", () => {
    expect(queryKeys.portal.supplierDashboard(userId)).toEqual([
      "portal",
      "supplier",
      userId,
    ]);
    expect(queryKeys.portal.supplierDashboard(userId)).toEqual([
      ...queryKeys.portal.supplier(),
      userId,
    ]);
  });

  it("clientDashboard matches portal.client + userId", () => {
    expect(queryKeys.portal.clientDashboard(userId)).toEqual([
      "portal",
      "client",
      userId,
    ]);
  });

  it("clientCatalogDashboard matches portal.clientCatalog + userId", () => {
    expect(queryKeys.portal.clientCatalogDashboard(userId)).toEqual([
      "portal",
      "client",
      "catalog",
      userId,
    ]);
  });

  it("role keys are distinct from admin supplierPortal / clientPortal", () => {
    expect(queryKeys.portal.supplierDashboard(userId)).not.toEqual(
      queryKeys.supplierPortal.overview(),
    );
    expect(queryKeys.portal.clientDashboard(userId)).not.toEqual(
      queryKeys.clientPortal.overview(),
    );
  });
});
