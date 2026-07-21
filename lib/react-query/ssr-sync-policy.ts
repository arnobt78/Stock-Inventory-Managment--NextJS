/**
 * SSR → TanStack sync policy.
 * REQ-0122 / REQ-0133 — never clobber fresher client cache after CRUD / back-nav.
 * REQ-0202 — prefer richer densify when updatedAt is equal (email/image/role flash guard).
 */

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * REQ-0202 — densify keys that often arrive later via client refetch when a
 * thinner cache row was seeded (list patch / warm prefetch).
 */
const DENSIFY_KEY_RE =
  /(Email|Image|ImageUrl)$|^(role|overview)$|^relatedProduct|^creator|^assignedTo|^reviewer|^productOwner|^supplierImage/;

function densifyValuePresent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") return true;
  return true;
}

/** True when server has at least one densify field defined that cache lacks. */
export function serverHasRicherDensify(
  serverData: unknown,
  cached: unknown,
): boolean {
  if (!isPlainObject(serverData) || !isPlainObject(cached)) {
    return false;
  }
  for (const key of Object.keys(serverData)) {
    if (!DENSIFY_KEY_RE.test(key)) continue;
    const serverVal = serverData[key];
    if (!densifyValuePresent(serverVal)) continue;
    const cachedVal = cached[key];
    if (!densifyValuePresent(cachedVal)) {
      return true;
    }
  }
  return false;
}

/**
 * Decide whether SSR props should overwrite TanStack cache on mount.
 * router.back() can restore stale RSC props — never clobber fresher client cache.
 * REQ-0133: default skip when server cannot prove fresher than cached (lists + entities).
 * REQ-0202: apply when timestamps equal (or both missing) but SSR densify is richer.
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
      if (cachedAt > serverAt) {
        return "skip";
      }
      if (serverAt > cachedAt) {
        return "apply";
      }
      // Equal timestamps — lists stay skip (row densify handled at entity sync)
      return "skip";
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

  // Entity: fresher cache wins
  if (serverAt != null && cachedAt != null && cachedAt > serverAt) {
    return "skip";
  }
  if (serverAt != null && cachedAt != null && serverAt > cachedAt) {
    return "apply";
  }

  // Equal timestamps (or both null) — prefer richer densify SSR (REQ-0202)
  if (
    cached !== undefined &&
    (serverAt === cachedAt || (serverAt == null && cachedAt == null)) &&
    serverHasRicherDensify(serverData, cached)
  ) {
    return "apply";
  }

  if (serverAt != null && cachedAt != null && cachedAt >= serverAt) {
    return "skip";
  }

  if (cached !== undefined) {
    return "skip";
  }

  return "apply";
}
