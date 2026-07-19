/**
 * REQ-0160 — Role-aware Overview card blurbs on admin user-management detail.
 * Numbers/KPI math unchanged (see user-detail-data); copy only.
 */

import type { UserRole } from "@/types";

/** Store-owner roles — owned catalog + store order revenue. */
export function isStoreOwnerOverviewRole(
  role: UserRole | string | null | undefined,
): boolean {
  const r = (role ?? "").toLowerCase();
  return r === "admin" || r === "user";
}

/**
 * Short Overview description for the viewed user's role.
 * Avoids implying every role has "spent as buyer" semantics.
 */
export function getUserOverviewDescription(
  role: UserRole | string | null | undefined,
): string {
  const r = (role ?? "").toLowerCase();

  switch (r) {
    case "admin":
    case "user":
      return "Store-owner metrics: owned orders, invoices, and catalog. Revenue from owned store orders. Spent/Due only if this user bought as a distinct client.";
    case "client":
      return "Buyer metrics: orders and invoices as client. Spent/Due as buyer; revenue is $0.";
    case "supplier":
      return "Supplier metrics: revenue from product lines. Orders/invoices as buyer are usually $0.";
    case "retailer":
      return "Linked orders, invoices, and catalog activity for this retailer account.";
    default:
      return "Orders, invoices, and catalog activity linked to this user.";
  }
}

/** True when My Activity tip should show (own store-owner account). */
export function shouldShowMyActivityTip(options: {
  isOwner: boolean;
  role: UserRole | string | null | undefined;
}): boolean {
  return options.isOwner && isStoreOwnerOverviewRole(options.role);
}
