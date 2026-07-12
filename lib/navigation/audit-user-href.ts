/**
 * REQ-0089 — role-aware href for catalog entity audit fields (Created by / Updated by).
 * Admin → user management detail; client/supplier → no link (avoids misleading owner browse).
 */

/** Admin-only link to user management; undefined for non-admin viewers. */
export function resolveAuditUserManagementHref(
  userId: string,
  isAdminRole: boolean,
): string | undefined {
  if (!isAdminRole || !userId) return undefined;
  return `/admin/user-management/${userId}`;
}
