/**
 * Central invalidation for all data queries
 * Call after any CRUD (product, category, supplier, order, invoice, warehouse,
 * payment, shipping, ticket, review, etc.) so user/admin/client/supplier
 * dashboards, list pages, detail pages, cards, badges, and tables stay in sync.
 *
 * Prefer `*.lists()` for entities that only expose list + detail keys. Use `*.all`
 * when the domain has extra sub-keys (e.g. invoices.byOrder, productReviews.byProduct)
 * so every mounted query under that prefix refetches. Delete mutations cancel/remove
 * detail keys first so `*.all` does not refetch deleted resources (404).
 */

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./config";

/**
 * Invalidates every query that displays server data so all related UI updates
 * without refresh: user/client/supplier pages, admin panel, detail pages,
 * dashboards, list tables, cards, badges, back buttons, activity feed, etc.
 */
export function invalidateAllRelatedQueries(queryClient: QueryClient): void {
  // Catalog (list+detail) — lists() only; delete hooks remove detail before this runs
  queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.clientOrders.lists() });
  // invoices.byOrder on order detail — lists() would leave it stale
  queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.clientInvoices.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.lists() });
  // Import creates new rows; no client delete — .all refreshes list + open detail
  queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
  // detail + "replies" sub-key — lists() would leave open ticket pages stale
  queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets.all });
  // byProduct + eligibility on product pages — lists() would leave them stale
  queryClient.invalidateQueries({ queryKey: queryKeys.productReviews.all });
  // Aggregates, portals, admin sidebars
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.clientPortal.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.supplierPortal.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stockAllocation.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.forecasting.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.portal.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
}

/**
 * Back-button / leave-detail navigation only (REQ-0220).
 * Soft-nav keeps the departing detail mounted until the list RSC lands — invalidating
 * `*.all`, `forecasting`, or `stockAllocation` refetches active detail slots and flashes
 * empty/`—` UI. Lists + dashboards/portals are enough for a fresh destination.
 * Mutations still use invalidateAfterCatalogChange / OrderGraph / StockChange.
 */
export function invalidateAfterBackNavigation(
  queryClient: QueryClient,
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.clientOrders.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.clientInvoices.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.history.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.productReviews.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.clientPortal.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.supplierPortal.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.portal.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
}

/**
 * Order / payment / shipping / invoice changes affect nested order rows on
 * product, category, and supplier detail payloads (recentOrders.orderStatus).
 * Broad invalidation uses *.lists() for catalog entities — detail queries stay stale without this.
 */
export function invalidateAfterOrderGraphChange(
  queryClient: QueryClient,
): void {
  invalidateAllRelatedQueries(queryClient);
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
}

/**
 * Stock-heavy entities: catalog + product detail invalidation.
 */
export function invalidateAfterStockChange(queryClient: QueryClient): void {
  invalidateAfterCatalogChange(queryClient);
}

/**
 * Catalog CRUD (product/category/supplier/warehouse) — lists, detail, portals, dashboards.
 * REQ-0133: detail keys included so embedded names/qty stay in sync after rename/qty change.
 */
export function invalidateAfterCatalogChange(queryClient: QueryClient): void {
  invalidateAllRelatedQueries(queryClient);
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
}
