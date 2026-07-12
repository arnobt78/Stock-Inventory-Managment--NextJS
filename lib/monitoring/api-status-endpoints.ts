/**
 * API Status page — probe targets scoped by role.
 * Health is fetched separately in loadSystemStatus (not duplicated here).
 */

export type ApiStatusRole = "admin" | "user" | "supplier" | "client";

export type ApiStatusEndpointDef = {
  name: string;
  path: string;
  /** Omit = all authenticated roles may probe this route. */
  roles?: readonly ApiStatusRole[];
};

/** Core probes for every logged-in role. */
const CORE_ENDPOINTS: readonly ApiStatusEndpointDef[] = [
  { name: "Authentication", path: "/api/auth/session" },
  { name: "Orders", path: "/api/orders" },
  { name: "Invoices", path: "/api/invoices" },
  { name: "Notifications", path: "/api/notifications/in-app" },
  { name: "OpenAPI Spec", path: "/api/openapi" },
];

/** Catalog + admin ops — skip for client (uses portal browse APIs instead). */
const CATALOG_ADMIN_ENDPOINTS: readonly ApiStatusEndpointDef[] = [
  {
    name: "Products",
    path: "/api/products",
    roles: ["admin", "user", "supplier"],
  },
  {
    name: "Categories",
    path: "/api/categories",
    roles: ["admin", "user", "supplier"],
  },
  {
    name: "Suppliers",
    path: "/api/suppliers",
    roles: ["admin", "user", "supplier"],
  },
  {
    name: "Warehouses",
    path: "/api/warehouses",
    roles: ["admin", "user", "supplier"],
  },
  {
    name: "Dashboard",
    path: "/api/dashboard",
    roles: ["admin", "user", "supplier"],
  },
  {
    name: "Support Tickets",
    path: "/api/support-tickets",
    roles: ["admin", "user", "supplier", "client"],
  },
  {
    name: "Product Reviews",
    path: "/api/product-reviews",
    roles: ["admin", "user", "supplier"],
  },
  {
    name: "Import History",
    path: "/api/import-history",
    roles: ["admin", "user"],
  },
  {
    name: "Performance",
    path: "/api/performance",
    roles: ["admin", "user"],
  },
  {
    name: "System Metrics",
    path: "/api/system-metrics",
    roles: ["admin", "user"],
  },
];

export const API_STATUS_ENDPOINTS: readonly ApiStatusEndpointDef[] = [
  ...CORE_ENDPOINTS,
  ...CATALOG_ADMIN_ENDPOINTS,
];

/** Endpoints this role should probe on /api-status (avoids client catalog/dashboard noise). */
export function getApiStatusEndpointsForRole(
  role: string | null | undefined,
): ApiStatusEndpointDef[] {
  const normalized = (role ?? "user") as ApiStatusRole;
  return API_STATUS_ENDPOINTS.filter(
    (ep) => !ep.roles || ep.roles.includes(normalized),
  );
}
