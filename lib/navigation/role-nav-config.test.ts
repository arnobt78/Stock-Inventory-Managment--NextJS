import { describe, expect, it } from "vitest";
import {
  getNavPathsForRole,
  getProfileMenuPaths,
  getWarmPathsForRole,
} from "@/lib/navigation/role-nav-config";
import { getAdminSidebarWarmPaths } from "@/lib/navigation/admin-nav-config";

describe("role-nav-config (REQ-0094)", () => {
  it("returns role-scoped navbar paths", () => {
    expect(getNavPathsForRole("client")).toEqual([
      "/client",
      "/products",
      "/orders",
      "/invoices",
    ]);
    expect(getNavPathsForRole("supplier")).toEqual([
      "/supplier",
      "/products",
      "/orders",
      "/invoices",
    ]);
    expect(getNavPathsForRole("admin")).toHaveLength(9);
  });

  it("includes profile menu paths for all roles", () => {
    expect(getProfileMenuPaths()).toEqual([
      "/support-tickets",
      "/settings/email-preferences",
      "/api-docs",
      "/api-status",
    ]);
  });

  it("dedupes warm paths and adds admin sidebar for admin/user", () => {
    const adminWarm = getWarmPathsForRole("admin");
    const clientWarm = getWarmPathsForRole("client");
    expect(adminWarm).toContain("/admin/dashboard-overall-insights");
    expect(adminWarm).not.toContain("/admin");
    expect(adminWarm.length).toBe(
      new Set([
        ...getNavPathsForRole("admin").map((p) =>
          p === "/admin" ? "/admin/dashboard-overall-insights" : p,
        ),
        ...getProfileMenuPaths(),
        ...getAdminSidebarWarmPaths(),
      ]).size,
    );
    expect(clientWarm).not.toEqual(
      expect.arrayContaining(getAdminSidebarWarmPaths()),
    );
    expect(new Set(adminWarm).size).toBe(adminWarm.length);
  });
});
