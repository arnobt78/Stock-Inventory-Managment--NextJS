/**
 * TanStack Query exports
 * Centralized export point for React Query utilities.
 * After CRUD, call invalidateAllRelatedQueries from mutation hooks (see npm run test:invalidate).
 */

export { createQueryClient, queryKeys } from "./config";
export { QueryProvider } from "./provider";
export {
  invalidateAllRelatedQueries,
  invalidateAfterOrderGraphChange,
  invalidateAfterStockChange,
} from "./invalidate-all";
export { cancelOrRemoveDetailQuery } from "./cancel-or-remove-detail";
export {
  isDataSlotLoading,
  isAnyDataSlotLoading,
  isDataSlotRefreshing,
  isDataSlotUnsettled,
  isAnyDataSlotUnsettled,
} from "./is-data-slot-loading";
export type { DataSlotQueryHint } from "./is-data-slot-loading";
export {
  patchDetailCache,
  patchDetailCacheMerge,
  patchListCaches,
  patchOrderGraphListCaches,
  patchProductInPortalCaches,
  removeProductFromPortalCaches,
  removeFromListCaches,
  patchStockAllocationInCaches,
  removeStockAllocationFromCaches,
} from "./patch-mutation-cache";
export { withInitialData } from "./initial-data-options";
export {
  useSyncSsrQueryData,
  useSyncSsrQueryDataMany,
} from "@/hooks/use-sync-ssr-query-data";
export type { SsrQuerySyncEntry } from "@/hooks/use-sync-ssr-query-data";
export { warmQueriesForUser, warmAdminClientPortalLists } from "./warm-route-prefetch";

