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

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateAllRelatedQueries,
  invalidateAfterOrderGraphChange,
  invalidateAfterStockChange,
} from "@/lib/react-query";

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
  | "user";

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
  // All other entities: full cross-domain invalidation covers lists + dashboards
  invalidateAllRelatedQueries(queryClient);
}

export function useBackWithRefresh(entity: EntityType) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleBack = () => {
    runInvalidations(queryClient, entity);
    router.back();
  };

  const navigateTo = (path: string) => {
    runInvalidations(queryClient, entity);
    router.push(path);
  };

  return { handleBack, navigateTo };
}
