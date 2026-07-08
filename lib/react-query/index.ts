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
export { isDataSlotLoading, isAnyDataSlotLoading } from "./is-data-slot-loading";
export { withInitialData } from "./initial-data-options";

