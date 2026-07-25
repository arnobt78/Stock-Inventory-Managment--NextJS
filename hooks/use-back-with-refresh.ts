/**
 * useBackWithRefresh
 * Central back-navigation hook used on ALL detail pages.
 * Invalidates relevant TanStack Query caches before navigating so the list/dashboard
 * always shows fresh data when the user returns — no manual page refresh needed.
 *
 * Supports every entity that has a detail page in the app.
 * Usage:
 *   const { handleBack, navigateTo } = useBackWithRefresh("order");
 *   - handleBack()           → invalidate + router.back()
 *   - navigateTo("/orders")  → invalidate + router.push("/orders")
 */

import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateAllRelatedQueries,
  invalidateAfterOrderGraphChange,
  invalidateAfterStockChange,
  invalidateAfterCatalogChange,
  queryKeys,
} from "@/lib/react-query";
import { consumeStripeCheckoutReturn } from "@/lib/payments/stripe-return";

export type UseBackWithRefreshOptions = {
  /** When set, used instead of router.back() after Stripe checkout return. */
  fallbackPath?: string;
};

/** All entity types that have a back-button detail page. */
export type EntityType =
  | "order"
  | "invoice"
  | "product"
  | "category"
  | "supplier"
  | "warehouse"
  | "support-ticket"
  | "product-review"
  | "user"
  | "history";

function runInvalidations(
  queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>,
  entity: EntityType,
) {
  // Order/invoice flows stale many cross-domain keys (stock, invoices, portals)
  if (entity === "order" || entity === "invoice") {
    invalidateAfterOrderGraphChange(queryClient);
    return;
  }
  // Stock-heavy entities: explicit stock graph invalidation + broad sweep
  if (entity === "warehouse" || entity === "product") {
    invalidateAfterStockChange(queryClient);
    return;
  }
  if (entity === "category" || entity === "supplier") {
    invalidateAfterCatalogChange(queryClient);
    return;
  }
  // Read-only admin history detail — narrow list refresh only
  if (entity === "history") {
    void queryClient.invalidateQueries({ queryKey: queryKeys.history.lists() });
    return;
  }
  // All other entities: full cross-domain invalidation covers lists + dashboards
  invalidateAllRelatedQueries(queryClient);
}

export function useBackWithRefresh(
  entity: EntityType,
  options?: UseBackWithRefreshOptions,
) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const fallbackPath = options?.fallbackPath;

  const handleBack = () => {
    runInvalidations(queryClient, entity);
    // Clear Stripe return flag when present (history may still contain checkout.stripe.com)
    consumeStripeCheckoutReturn();
    // Prefer explicit list path when set (admin order detail → /admin/orders)
    if (fallbackPath) {
      router.push(fallbackPath);
      return;
    }
    router.back();
  };

  const navigateTo = (path: string) => {
    runInvalidations(queryClient, entity);
    router.push(path);
  };

  return { handleBack, navigateTo };
}
