import { describe, expect, it } from "vitest";
import {
  resolveAuditUserManagementHref,
  resolveDetailAuditUserHref,
} from "@/lib/navigation/audit-user-href";

describe("resolveAuditUserManagementHref", () => {
  it("returns admin user management path for admin viewers", () => {
    expect(resolveAuditUserManagementHref("user-1", true)).toBe(
      "/admin/user-management/user-1",
    );
  });

  it("returns undefined for client and supplier viewers", () => {
    expect(resolveAuditUserManagementHref("user-1", false)).toBeUndefined();
  });

  it("returns undefined when user id missing", () => {
    expect(resolveAuditUserManagementHref("", true)).toBeUndefined();
  });
});

describe("resolveDetailAuditUserHref", () => {
  it("returns user management path for admin viewers", () => {
    expect(resolveDetailAuditUserHref("user-1", true)).toBe(
      "/admin/user-management/user-1",
    );
  });

  it("returns products owner browse for non-admin viewers", () => {
    expect(resolveDetailAuditUserHref("user-1", false)).toBe(
      "/products?ownerId=user-1",
    );
  });

  it("returns undefined when user id missing", () => {
    expect(resolveDetailAuditUserHref("", true)).toBeUndefined();
    expect(resolveDetailAuditUserHref("", false)).toBeUndefined();
  });
});
