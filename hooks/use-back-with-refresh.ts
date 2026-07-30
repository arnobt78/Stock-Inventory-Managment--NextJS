/**
 * useBackWithRefresh
 * Central back-navigation hook used on ALL detail pages.
 * Navigates first, then invalidates list/dashboard caches so the destination is fresh
 * without refetching the still-mounted detail (soft-nav flash — REQ-0220).
 *
 * Supports every entity that has a detail page in the app.
 * Usage:
 *   const { handleBack, navigateTo } = useBackWithRefresh("order");
 *   - handleBack()           → router.back() + list-safe invalidate
 *   - navigateTo("/orders")  → router.push + list-safe invalidate
 */

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateAfterBackNavigation,
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

function runBackInvalidations(
  queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>,
  entity: EntityType,
) {
  // History detail — narrow list only (unchanged)
  if (entity === "history") {
    void queryClient.invalidateQueries({ queryKey: queryKeys.history.lists() });
    return;
  }
  // REQ-0220 — lists/dashboards only; never *.all / forecasting / stock while detail painted
  invalidateAfterBackNavigation(queryClient);
}

export function useBackWithRefresh(
  entity: EntityType,
  options?: UseBackWithRefreshOptions,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fallbackPath = options?.fallbackPath;

  const handleBack = () => {
    // Clear Stripe return flag when present (history may still contain checkout.stripe.com)
    consumeStripeCheckoutReturn();
    // Prefer explicit list path when set (admin order detail → /admin/orders)
    // Navigate BEFORE invalidate so departing detail is not painted as unsettled (REQ-0220)
    if (fallbackPath) {
      router.push(fallbackPath);
    } else {
      router.back();
    }
    runBackInvalidations(queryClient, entity);
  };

  const navigateTo = (path: string) => {
    router.push(path);
    runBackInvalidations(queryClient, entity);
  };

  return { handleBack, navigateTo };
}
