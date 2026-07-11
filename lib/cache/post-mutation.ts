/**
 * Post-mutation side effects — run after the HTTP response is sent via Next.js `after()`.
 * Keeps CRUD routes fast on Vercel (avoids FUNCTION_INVOCATION_TIMEOUT on ImageKit / Redis SCAN).
 * Client TanStack `invalidateAllRelatedQueries` still runs immediately on mutation success.
 *
 * Each schedule* helper clears only Redis keys that domain can stale — mirrors TanStack scopes
 * in `lib/react-query/invalidate-all.ts` where applicable.
 */

import { after } from "next/server";
import { logger } from "@/lib/logger";
import {
  cacheKeys,
  invalidateAllServerCaches,
  invalidateCache,
} from "./cache-utils";

async function invalidatePatterns(patterns: readonly string[]): Promise<void> {
  await Promise.all(patterns.map((pattern) => invalidateCache(pattern)));
}

function schedulePatterns(
  patterns: readonly string[],
  label: string,
): void {
  after(async () => {
    try {
      await invalidatePatterns(patterns);
    } catch (error) {
      logger.error(`Deferred ${label} cache invalidation failed:`, error);
    }
  });
}

/** Order / payment / shipping — catalog recentOrders + invoices + stock + portals. */
const ORDER_GRAPH_PATTERNS = [
  cacheKeys.orders.pattern,
  cacheKeys.invoices.pattern,
  cacheKeys.products.pattern,
  cacheKeys.categories.pattern,
  cacheKeys.suppliers.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.notifications.pattern,
  cacheKeys.stockAllocation.pattern,
  cacheKeys.portal.pattern,
  cacheKeys.clientPortal.pattern,
  cacheKeys.supplierPortal.pattern,
  "forecasting:*",
] as const;

/** Invoice CRUD / send / reminders — financial + order invoice linkage. */
const INVOICE_PATTERNS = [
  cacheKeys.invoices.pattern,
  cacheKeys.orders.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.notifications.pattern,
  cacheKeys.portal.pattern,
  cacheKeys.clientPortal.pattern,
  "forecasting:*",
] as const;

const SUPPORT_TICKET_PATTERNS = [
  cacheKeys.supportTickets.pattern,
  cacheKeys.notifications.pattern,
  cacheKeys.dashboard.pattern,
] as const;

const PRODUCT_REVIEW_PATTERNS = [
  cacheKeys.productReviews.pattern,
  cacheKeys.products.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
] as const;

const USER_PATTERNS = [
  cacheKeys.userManagement.pattern,
  cacheKeys.sessions.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
  cacheKeys.clientPortal.pattern,
  cacheKeys.supplierPortal.pattern,
] as const;

const NOTIFICATION_PATTERNS = [cacheKeys.notifications.pattern] as const;

const AUTH_PATTERNS = [
  cacheKeys.userManagement.pattern,
  cacheKeys.sessions.pattern,
  cacheKeys.dashboard.pattern,
] as const;

const EMAIL_PREFERENCE_PATTERNS = [cacheKeys.notifications.pattern] as const;

const SYSTEM_CONFIG_PATTERNS = [
  "system-config:*",
  cacheKeys.dashboard.pattern,
  "forecasting:*",
] as const;

const IMPORT_PATTERNS = [
  cacheKeys.products.pattern,
  cacheKeys.history.pattern,
  cacheKeys.categories.pattern,
  cacheKeys.suppliers.pattern,
  cacheKeys.dashboard.pattern,
  "forecasting:*",
] as const;

const PRODUCT_PATTERNS = [
  cacheKeys.products.pattern,
  cacheKeys.stockAllocation.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
  cacheKeys.clientPortal.pattern,
  cacheKeys.supplierPortal.pattern,
  cacheKeys.productReviews.pattern,
  cacheKeys.history.pattern,
  "forecasting:*",
] as const;

const CATEGORY_PATTERNS = [
  cacheKeys.categories.pattern,
  cacheKeys.products.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
] as const;

const SUPPLIER_PATTERNS = [
  cacheKeys.suppliers.pattern,
  cacheKeys.products.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
  cacheKeys.supplierPortal.pattern,
] as const;

const WAREHOUSE_PATTERNS = [
  cacheKeys.stockAllocation.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
  cacheKeys.clientPortal.pattern,
  cacheKeys.userManagement.pattern,
] as const;

const STOCK_ALLOCATION_PATTERNS = [
  cacheKeys.stockAllocation.pattern,
  cacheKeys.products.pattern,
  cacheKeys.dashboard.pattern,
  cacheKeys.portal.pattern,
] as const;

/** Full Redis wipe — escape hatch / scripts only; avoid on hot CRUD paths. */
export function scheduleInvalidateAllServerCaches(): void {
  after(async () => {
    try {
      await invalidateAllServerCaches();
    } catch (error) {
      logger.error("Deferred invalidateAllServerCaches failed:", error);
    }
  });
}

export function scheduleInvalidateProductCaches(): void {
  schedulePatterns(PRODUCT_PATTERNS, "product");
}

export function scheduleInvalidateCategoryCaches(): void {
  schedulePatterns(CATEGORY_PATTERNS, "category");
}

export function scheduleInvalidateSupplierCaches(): void {
  schedulePatterns(SUPPLIER_PATTERNS, "supplier");
}

export function scheduleInvalidateWarehouseCaches(): void {
  schedulePatterns(WAREHOUSE_PATTERNS, "warehouse");
}

export function scheduleInvalidateStockAllocationCaches(): void {
  schedulePatterns(STOCK_ALLOCATION_PATTERNS, "stock-allocation");
}

export function scheduleInvalidateOrderGraphCaches(): void {
  schedulePatterns(ORDER_GRAPH_PATTERNS, "order-graph");
}

export function scheduleInvalidateInvoiceCaches(): void {
  schedulePatterns(INVOICE_PATTERNS, "invoice");
}

export function scheduleInvalidateSupportTicketCaches(): void {
  schedulePatterns(SUPPORT_TICKET_PATTERNS, "support-ticket");
}

export function scheduleInvalidateProductReviewCaches(): void {
  schedulePatterns(PRODUCT_REVIEW_PATTERNS, "product-review");
}

export function scheduleInvalidateUserCaches(): void {
  schedulePatterns(USER_PATTERNS, "user");
}

export function scheduleInvalidateNotificationCaches(): void {
  schedulePatterns(NOTIFICATION_PATTERNS, "notification");
}

export function scheduleInvalidateAuthCaches(): void {
  schedulePatterns(AUTH_PATTERNS, "auth");
}

export function scheduleInvalidateEmailPreferenceCaches(): void {
  schedulePatterns(EMAIL_PREFERENCE_PATTERNS, "email-preference");
}

export function scheduleInvalidateSystemConfigCaches(): void {
  schedulePatterns(SYSTEM_CONFIG_PATTERNS, "system-config");
}

export function scheduleInvalidateImportCaches(): void {
  schedulePatterns(IMPORT_PATTERNS, "import");
}

/** Arbitrary async work after response (ImageKit cleanup, etc.). */
export function scheduleAfterResponse(
  task: () => Promise<void>,
  label: string,
): void {
  after(async () => {
    try {
      await task();
    } catch (error) {
      logger.warn(`Deferred post-response task [${label}] failed:`, error);
    }
  });
}

/** @deprecated Use scheduleInvalidateOrderGraphCaches — audit spec alias */
export function invalidateOnOrderChange(): void {
  scheduleInvalidateOrderGraphCaches();
}

/** @deprecated Use scheduleInvalidateProductCaches — audit spec alias */
export function invalidateOnProductChange(): void {
  scheduleInvalidateProductCaches();
}

/** @deprecated Use scheduleInvalidateCategoryCaches — audit spec alias */
export function invalidateOnCategoryChange(): void {
  scheduleInvalidateCategoryCaches();
}

/** @deprecated Use scheduleInvalidateSupplierCaches — audit spec alias */
export function invalidateOnSupplierChange(): void {
  scheduleInvalidateSupplierCaches();
}

/** @deprecated Combined category+supplier — prefer entity-specific schedules */
export function invalidateOnCategoryOrSupplierChange(): void {
  schedulePatterns(
    [
      ...CATEGORY_PATTERNS,
      cacheKeys.suppliers.pattern,
      cacheKeys.supplierPortal.pattern,
    ],
    "category-supplier",
  );
}

/** @deprecated Use scheduleInvalidateWarehouseCaches — audit spec alias */
export function invalidateOnWarehouseChange(): void {
  scheduleInvalidateWarehouseCaches();
}
