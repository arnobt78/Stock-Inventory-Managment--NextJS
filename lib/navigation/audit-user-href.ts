/**
 * REQ-0089 — admin-only user-management href (narrow use).
 * REQ-0165/0166 — detail audit Created by / Updated by for order, invoice, catalog:
 * admin → user management; non-admin → /products?ownerId=.
 */

import { resolveOwnerProductsHref } from "@/lib/navigation/owner-products-href";

/** Admin-only link to user management; undefined for non-admin viewers. */
export function resolveAuditUserManagementHref(
  userId: string,
  isAdminRole: boolean,
): string | undefined {
  if (!isAdminRole || !userId) return undefined;
  return `/admin/user-management/${userId}`;
}

/**
 * Shared detail audit href (Order/Invoice/Category/Supplier/Warehouse/Product Updated by).
 * Admin → /admin/user-management/{id}; else → /products?ownerId={id}.
 */
export function resolveDetailAuditUserHref(
  userId: string,
  isAdminRole: boolean,
): string | undefined {
  if (!userId) return undefined;
  if (isAdminRole) return resolveAuditUserManagementHref(userId, true);
  return resolveOwnerProductsHref(userId, false);
}
