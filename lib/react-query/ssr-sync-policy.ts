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

/** Max row updatedAt for list payloads (REQ-0133). */
function maxUpdatedAtMs(value: unknown): number | null {
  if (!Array.isArray(value)) {
    return getUpdatedAtMs(value);
  }
  let max: number | null = null;
  for (const row of value) {
    const ms = getUpdatedAtMs(row);
    if (ms != null && (max == null || ms > max)) {
      max = ms;
    }
  }
  return max;
}

/**
 * Decide whether SSR props should overwrite TanStack cache on mount.
 * router.back() can restore stale RSC props — never clobber fresher client cache.
 * REQ-0133: default skip when server cannot prove fresher than cached (lists + entities).
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

  const serverAt = maxUpdatedAtMs(serverData);
  const cachedAt = maxUpdatedAtMs(cached);

  if (Array.isArray(cached) && Array.isArray(serverData)) {
    if (serverAt != null && cachedAt != null) {
      if (cachedAt >= serverAt) {
        return "skip";
      }
      return "apply";
    }
    if (cached.length > 0 && serverData.length === cached.length) {
      return "skip";
    }
    if (cached.length === 0 && serverData.length > 0) {
      return "apply";
    }
    if (cached !== undefined) {
      return "skip";
    }
    return "apply";
  }

  if (serverAt != null && cachedAt != null && cachedAt >= serverAt) {
    return "skip";
  }
  if (serverAt != null && cachedAt != null && serverAt > cachedAt) {
    return "apply";
  }

  if (cached !== undefined) {
    return "skip";
  }

  return "apply";
}
