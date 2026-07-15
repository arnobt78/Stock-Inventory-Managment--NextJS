import type { UseQueryResult } from "@tanstack/react-query";

/** Subset of TanStack state used for REQ-0021 / REQ-0122 data-slot predicates. */
export type DataSlotQueryHint = Pick<
  UseQueryResult<unknown>,
  "isPending" | "data" | "isFetching" | "isStale"
>;

/**
 * True during post-invalidate refetch while stale placeholder data may still be visible.
 * Prefer setQueryData patch first; use this for aggregates (dashboard, portal stats) that
 * are not row-patched on every mutation.
 */
export function isDataSlotRefreshing(
  query: DataSlotQueryHint,
): boolean {
  return (
    query.data !== undefined &&
    query.isFetching === true &&
    query.isStale === true &&
    query.isPending !== true
  );
}

/**
 * True when a data slot should show inline pulse on cold load (REQ-0021).
 * Shell (titles, headers, filters) stays visible; only values pulse.
 * SSR initialData or persisted cache → false on first paint.
 */
export function isDataSlotLoading<TData>(
  query: Pick<UseQueryResult<TData>, "isPending" | "data">,
  serverInitial?: unknown,
): boolean {
  if (serverInitial != null) return false;
  if (query.data !== undefined) return false;
  return query.isPending;
}

/**
 * Pulse when cold-loading OR when a stale refetch may show wrong numbers (REQ-0122).
 * Use on dashboard/stat slots; detail/list rows patched via setQueryData should use
 * isDataSlotLoading only so correct patched values stay visible during refetch.
 */
export function isDataSlotUnsettled<TData>(
  query: Pick<
    UseQueryResult<TData>,
    "isPending" | "data" | "isFetching" | "isStale"
  >,
  serverInitial?: unknown,
): boolean {
  if (isDataSlotRefreshing(query)) return true;
  return isDataSlotLoading(query, serverInitial);
}

/**
 * Combine multiple queries — pulse when any entry is unsettled.
 */
export function isAnyDataSlotLoading(
  entries: Array<{
    query: Pick<UseQueryResult<unknown>, "isPending" | "data">;
    serverInitial?: unknown;
  }>,
): boolean {
  return entries.some(({ query, serverInitial }) =>
    isDataSlotLoading(query, serverInitial),
  );
}

/** Combine multiple queries — pulse on cold load or stale refetch (REQ-0122 stats). */
export function isAnyDataSlotUnsettled(
  entries: Array<{
    query: DataSlotQueryHint;
    serverInitial?: unknown;
  }>,
): boolean {
  return entries.some(({ query, serverInitial }) =>
    isDataSlotUnsettled(query, serverInitial),
  );
}
