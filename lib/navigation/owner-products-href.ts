/**
 * REQ-0164 — role-aware owner product list href (catalog detail + Parties & Roles).
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

/** Self party name tone (logged-in viewer) — gray/white, not sky. */
export const PARTY_SELF_LINK_CLASS =
  "text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white";
