/**
 * Role-scoped navbar items + paths (REQ-0093).
 * Single source for Navbar rendering and RouteWarmPrefetch RSC warm.
 */

export type RoleNavItem =
  | { label: string; path: string; hasDropdown: false }
  | {
      label: string;
      path: string;
      hasDropdown: true;
      dropdownItems: Array<{ label: string; path: string }>;
    };

const ADMIN_NAV_ITEMS: RoleNavItem[] = [
  { label: "Dashboard", path: "/", hasDropdown: false },
  { label: "Products", path: "/products", hasDropdown: false },
  { label: "Orders", path: "/orders", hasDropdown: false },
  { label: "Invoices", path: "/invoices", hasDropdown: false },
  { label: "Categories", path: "/categories", hasDropdown: false },
  { label: "Suppliers", path: "/suppliers", hasDropdown: false },
  { label: "Warehouses", path: "/warehouses", hasDropdown: false },
  {
    label: "Business Insights",
    path: "/business-insights",
    hasDropdown: false,
  },
  { label: "Admin Panel", path: "/admin", hasDropdown: false },
];

const CLIENT_NAV_ITEMS: RoleNavItem[] = [
  { label: "Client Portal", path: "/client", hasDropdown: false },
  { label: "Browse Products", path: "/products", hasDropdown: false },
  { label: "My Orders", path: "/orders", hasDropdown: false },
  { label: "My Invoices", path: "/invoices", hasDropdown: false },
];

const SUPPLIER_NAV_ITEMS: RoleNavItem[] = [
  { label: "Supplier Portal", path: "/supplier", hasDropdown: false },
  { label: "My Products", path: "/products", hasDropdown: false },
  { label: "View Orders", path: "/orders", hasDropdown: false },
];

/** Navbar items for the given role (admin/user share admin nav). */
export function getNavItemsForRole(
  role: string | null | undefined,
): RoleNavItem[] {
  if (role === "client") return CLIENT_NAV_ITEMS;
  if (role === "supplier") return SUPPLIER_NAV_ITEMS;
  return ADMIN_NAV_ITEMS;
}

/** Flat paths from nav items — used for silent RSC prefetch after login. */
export function getNavPathsForRole(role: string | null | undefined): string[] {
  return getNavItemsForRole(role).map((item) => item.path);
}

/** Logo/home target per role. */
export function getHomePathForRole(role: string | null | undefined): string {
  if (role === "client") return "/client";
  if (role === "supplier") return "/supplier";
  return "/";
}
