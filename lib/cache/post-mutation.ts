/**
 * Post-mutation cache invalidation helpers.
 *
 * Architecture:
 * - Domain `scheduleInvalidate*Caches()` run synchronously (awaited by API routes before response).
 *   This eliminates the race condition where TanStack refetches while Redis still holds stale data.
 *   With scoped patterns (3–12 per domain vs 18 full-wipe), SCAN completes fast enough (< 200 ms
 *   in production) to avoid Vercel FUNCTION_INVOCATION_TIMEOUT.
 * - `scheduleAfterResponse()` uses `next/server after()` for external side-effects only (e.g.
 *   ImageKit cleanup, email dispatch) — things that don't affect GET cache responses.
 * - `scheduleInvalidateAllServerCaches()` keeps `after()` as escape hatch / scripts only.
 *
 * Client TanStack `invalidateAllRelatedQueries` fires immediately on mutation success (unchanged).
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
  cacheKeys.products.pattern,
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

/**
 * Full Redis wipe — escape hatch / scripts only; avoid on hot CRUD paths.
 * Still uses after() so it never blocks the response.
 */
export function scheduleInvalidateAllServerCaches(): void {
  after(async () => {
    try {
      await invalidateAllServerCaches();
    } catch (error) {
      logger.error("Deferred invalidateAllServerCaches failed:", error);
    }
  });
}

/**
 * Synchronous scoped invalidation helpers.
 * API routes MUST await these before returning NextResponse so the Redis keys
 * are cleared before the client re-fetches and hits the cache.
 *
 * Race condition avoided: client TanStack refetch fires on mutation success;
 * if Redis is cleared synchronously, the subsequent GET returns fresh DB data.
 */

export async function scheduleInvalidateProductCaches(): Promise<void> {
  try {
    await invalidatePatterns(PRODUCT_PATTERNS);
  } catch (error) {
    logger.error("Product cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateCategoryCaches(): Promise<void> {
  try {
    await invalidatePatterns(CATEGORY_PATTERNS);
  } catch (error) {
    logger.error("Category cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateSupplierCaches(): Promise<void> {
  try {
    await invalidatePatterns(SUPPLIER_PATTERNS);
  } catch (error) {
    logger.error("Supplier cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateWarehouseCaches(): Promise<void> {
  try {
    await invalidatePatterns(WAREHOUSE_PATTERNS);
  } catch (error) {
    logger.error("Warehouse cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateStockAllocationCaches(): Promise<void> {
  try {
    await invalidatePatterns(STOCK_ALLOCATION_PATTERNS);
  } catch (error) {
    logger.error("Stock-allocation cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateOrderGraphCaches(): Promise<void> {
  try {
    await invalidatePatterns(ORDER_GRAPH_PATTERNS);
  } catch (error) {
    logger.error("Order-graph cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateInvoiceCaches(): Promise<void> {
  try {
    await invalidatePatterns(INVOICE_PATTERNS);
  } catch (error) {
    logger.error("Invoice cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateSupportTicketCaches(): Promise<void> {
  try {
    await invalidatePatterns(SUPPORT_TICKET_PATTERNS);
  } catch (error) {
    logger.error("Support-ticket cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateProductReviewCaches(): Promise<void> {
  try {
    await invalidatePatterns(PRODUCT_REVIEW_PATTERNS);
  } catch (error) {
    logger.error("Product-review cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateUserCaches(): Promise<void> {
  try {
    await invalidatePatterns(USER_PATTERNS);
  } catch (error) {
    logger.error("User cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateNotificationCaches(): Promise<void> {
  try {
    await invalidatePatterns(NOTIFICATION_PATTERNS);
  } catch (error) {
    logger.error("Notification cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateAuthCaches(): Promise<void> {
  try {
    await invalidatePatterns(AUTH_PATTERNS);
  } catch (error) {
    logger.error("Auth cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateEmailPreferenceCaches(): Promise<void> {
  try {
    await invalidatePatterns(EMAIL_PREFERENCE_PATTERNS);
  } catch (error) {
    logger.error("Email-preference cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateSystemConfigCaches(): Promise<void> {
  try {
    await invalidatePatterns(SYSTEM_CONFIG_PATTERNS);
  } catch (error) {
    logger.error("System-config cache invalidation failed:", error);
  }
}

export async function scheduleInvalidateImportCaches(): Promise<void> {
  try {
    await invalidatePatterns(IMPORT_PATTERNS);
  } catch (error) {
    logger.error("Import cache invalidation failed:", error);
  }
}

/** Arbitrary async work after response (ImageKit cleanup, email, etc.) — still deferred. */
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

/** @deprecated Use scheduleInvalidateOrderGraphCaches (with await) — audit spec alias */
export async function invalidateOnOrderChange(): Promise<void> {
  await scheduleInvalidateOrderGraphCaches();
}

/** @deprecated Use scheduleInvalidateProductCaches (with await) — audit spec alias */
export async function invalidateOnProductChange(): Promise<void> {
  await scheduleInvalidateProductCaches();
}

