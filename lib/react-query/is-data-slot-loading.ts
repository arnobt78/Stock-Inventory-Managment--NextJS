import type { UseQueryResult } from "@tanstack/react-query";

/**
 * True when a data slot should show inline pulse (REQ-0021).
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
 * Combine multiple queries — pulse only when every source lacks data.
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
