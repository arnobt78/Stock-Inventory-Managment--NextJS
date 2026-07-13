export type SsrSyncAction = "apply" | "refetch" | "skip";

/** Subset of TanStack query state used for SSR sync decisions. */
export type SsrQueryStateHint = {
  isInvalidated?: boolean;
  fetchStatus?: "fetching" | "paused" | "idle";
};

/**
 * Decide whether SSR props should overwrite TanStack cache on mount.
 * router.back() can restore stale RSC props — never clobber fresher client cache.
 */
export function resolveSsrSyncAction<T>(
  serverData: T,
  cached: T | undefined,
  state: SsrQueryStateHint | undefined,
): SsrSyncAction {
  if (state?.isInvalidated || state?.fetchStatus === "fetching") {
    return "refetch";
  }
  if (
    Array.isArray(cached) &&
    Array.isArray(serverData) &&
    serverData.length < cached.length
  ) {
    return "skip";
  }
  return "apply";
}
