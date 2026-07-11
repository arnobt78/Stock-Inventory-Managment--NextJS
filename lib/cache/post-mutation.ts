/**
 * Post-mutation side effects — run after the HTTP response is sent via Next.js `after()`.
 * Keeps CRUD routes fast on Vercel (avoids FUNCTION_INVOCATION_TIMEOUT on ImageKit / Redis SCAN).
 * Client TanStack `invalidateAllRelatedQueries` still runs immediately on mutation success.
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

/** Full Redis wipe — deferred until after response (same keys as invalidateAllServerCaches). */
export function scheduleInvalidateAllServerCaches(): void {
  after(async () => {
    try {
      await invalidateAllServerCaches();
    } catch (error) {
      logger.error("Deferred invalidateAllServerCaches failed:", error);
    }
  });
}

/** Product CRUD — lists, stock, dashboards, reviews, forecasting. */
export function scheduleInvalidateProductCaches(): void {
  after(async () => {
    try {
      await invalidatePatterns([
        cacheKeys.products.pattern,
        cacheKeys.stockAllocation.pattern,
        cacheKeys.dashboard.pattern,
        cacheKeys.portal.pattern,
        cacheKeys.clientPortal.pattern,
        cacheKeys.supplierPortal.pattern,
        cacheKeys.productReviews.pattern,
        cacheKeys.history.pattern,
        "forecasting:*",
      ]);
    } catch (error) {
      logger.error("Deferred product cache invalidation failed:", error);
    }
  });
}

/** Category CRUD — catalog + products that reference category. */
export function scheduleInvalidateCategoryCaches(): void {
  after(async () => {
    try {
      await invalidatePatterns([
        cacheKeys.categories.pattern,
        cacheKeys.products.pattern,
        cacheKeys.dashboard.pattern,
        cacheKeys.portal.pattern,
      ]);
    } catch (error) {
      logger.error("Deferred category cache invalidation failed:", error);
    }
  });
}

/** Supplier CRUD — catalog + products that reference supplier. */
export function scheduleInvalidateSupplierCaches(): void {
  after(async () => {
    try {
      await invalidatePatterns([
        cacheKeys.suppliers.pattern,
        cacheKeys.products.pattern,
        cacheKeys.dashboard.pattern,
        cacheKeys.portal.pattern,
        cacheKeys.supplierPortal.pattern,
      ]);
    } catch (error) {
      logger.error("Deferred supplier cache invalidation failed:", error);
    }
  });
}

/**
 * Warehouse CRUD — stock rows embed warehouse name; dashboard/client browse show counts.
 * Skips orders/invoices/notifications (unaffected by warehouse metadata).
 */
export function scheduleInvalidateWarehouseCaches(): void {
  after(async () => {
    try {
      await invalidatePatterns([
        cacheKeys.stockAllocation.pattern,
        cacheKeys.dashboard.pattern,
        cacheKeys.portal.pattern,
        cacheKeys.clientPortal.pattern,
        cacheKeys.userManagement.pattern,
      ]);
    } catch (error) {
      logger.error("Deferred warehouse cache invalidation failed:", error);
    }
  });
}

/** Stock allocation writes — product list quantity + warehouse stock caches + dashboards. */
export function scheduleInvalidateStockAllocationCaches(): void {
  after(async () => {
    try {
      await invalidatePatterns([
        cacheKeys.stockAllocation.pattern,
        cacheKeys.products.pattern,
        cacheKeys.dashboard.pattern,
        cacheKeys.portal.pattern,
      ]);
    } catch (error) {
      logger.error("Deferred stock-allocation cache invalidation failed:", error);
    }
  });
}

/** Order / payment / shipping / invoice graph — broad invalidation (deferred). */
export function scheduleInvalidateOrderGraphCaches(): void {
  scheduleInvalidateAllServerCaches();
}

/** Arbitrary async work after response (ImageKit cleanup, etc.). Errors logged, never thrown to client. */
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

/** @deprecated Use scheduleInvalidateOrderGraphCaches — kept for route invalidation audit spec */
export function invalidateOnOrderChange(): void {
  scheduleInvalidateOrderGraphCaches();
}

/** @deprecated Use scheduleInvalidateProductCaches — kept for route invalidation audit spec */
export function invalidateOnProductChange(): void {
  scheduleInvalidateProductCaches();
}

/** @deprecated Use scheduleInvalidateCategoryCaches — kept for route invalidation audit spec */
export function invalidateOnCategoryOrSupplierChange(): void {
  after(async () => {
    try {
      await invalidatePatterns([
        cacheKeys.categories.pattern,
        cacheKeys.suppliers.pattern,
        cacheKeys.products.pattern,
        cacheKeys.dashboard.pattern,
        cacheKeys.portal.pattern,
        cacheKeys.supplierPortal.pattern,
      ]);
    } catch (error) {
      logger.error("Deferred category/supplier cache invalidation failed:", error);
    }
  });
}

/** @deprecated Use scheduleInvalidateWarehouseCaches — kept for route invalidation audit spec */
export function invalidateOnWarehouseChange(): void {
  scheduleInvalidateWarehouseCaches();
}
