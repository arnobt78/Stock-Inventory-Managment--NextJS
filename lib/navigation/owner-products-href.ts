/**
 * REQ-0164 / REQ-0166 — role-aware owner product list href (catalog detail + Parties & Roles).
 * Admin → /admin/products?ownerId=; client/supplier/store owner → /products?ownerId=.
 */

export function resolveOwnerProductsHref(
  ownerId: string,
  isAdminRole: boolean,
): string | undefined {
  if (!ownerId) return undefined;
  return isAdminRole
    ? `/admin/products?ownerId=${ownerId}`
    : `/products?ownerId=${ownerId}`;
}
