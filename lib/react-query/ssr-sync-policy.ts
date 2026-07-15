export type SsrSyncAction = "apply" | "refetch" | "skip";

/** Subset of TanStack query state used for SSR sync decisions. */
export type SsrQueryStateHint = {
  isInvalidated?: boolean;
  fetchStatus?: "fetching" | "paused" | "idle";
};

/** Parse ISO updatedAt for entity-level freshness compare (REQ-0122). */
function getUpdatedAtMs(value: unknown): number | null {
  if (!value || typeof value !== "object" || !("updatedAt" in value)) {
    return null;
  }
  const raw = (value as { updatedAt: unknown }).updatedAt;
  if (raw == null) return null;
  const ms = new Date(raw as string | Date).getTime();
  return Number.isFinite(ms) ? ms : null;
}

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
  const serverAt = getUpdatedAtMs(serverData);
  const cachedAt = getUpdatedAtMs(cached);
  if (serverAt != null && cachedAt != null && cachedAt >= serverAt) {
    return "skip";
  }
  return "apply";
}
