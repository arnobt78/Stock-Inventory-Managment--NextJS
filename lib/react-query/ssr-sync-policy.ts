/**
 * SSR → TanStack sync policy.
 * REQ-0122 / REQ-0133 — never clobber fresher client cache after CRUD / back-nav.
 * REQ-0202 — prefer richer densify when updatedAt is equal (email/image/role flash guard).
 */

/**
 * "applyDensifyOnly" (REQ-0136 Fix B) — same trust level as REQ-0202's equal-timestamp
 * densify case, but the caller must gap-fill densify fields only, never replace the
 * whole cached entity: a stale-but-differently-shaped SSR object could otherwise carry
 * an older status/paymentStatus that clobbers an already-patched, fresher cache value.
 */
export type SsrSyncAction = "apply" | "applyDensifyOnly" | "refetch" | "skip";

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
 * REQ-0202 / REQ-0209 / REQ-0218 — densify keys that often arrive later via client refetch when a
 * thinner cache row was seeded (list/create patch / warm prefetch).
 * Includes order/invoice party fields so Parties & Roles do not pop in after mount.
 * Catalog: insights / stats / committed / list share counts (soft-nav heal).
 */
const DENSIFY_KEY_RE =
  /(Email|Image|ImageUrl|UserId|Name)$|^(role|overview|orderProductOwners|invoiceForOrder|stripePaymentIntentId|creator|updater|supplier|category|items|productInsights|categoryInsights|supplierInsights|statistics|committedQuantity|recentOrders|productCount|catalogProductTotal)$|^relatedProduct|^placedBy|^assignedTo|^reviewer|^productOwner|^supplierImage|^linkedOrder/;

function densifyValuePresent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
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
    // Thin list/create string (e.g. supplier: "Name") vs SSR object densify
    if (typeof cachedVal === "string" && isPlainObject(serverVal)) {
      return true;
    }
  }
  return false;
}

function rowStatusBadgeFingerprint(row: unknown): string | null {
  if (!isPlainObject(row) || typeof row.id !== "string") return null;
  return [
    row.id,
    String(row.status ?? ""),
    String(row.paymentStatus ?? ""),
    String(row.linkedOrderStatus ?? ""),
    String(row.linkedOrderPaymentStatus ?? ""),
    String(row.statusAt ?? ""),
    String(row.linkedOrderStatusAt ?? ""),
  ].join("|");
}

/**
 * REQ-0225 — SSR allocation qty sum strictly below cache for shared row ids.
 * Proves DB/reconcile already shrunk while TanStack still holds pre-shrink qty
 * (common when byWarehouse was never patched / invalidate→refetch paints old first).
 * Inverse (SSR higher) means client patch is fresher — must keep cache.
 */
export function listHasLowerAllocationQuantities(
  serverData: unknown,
  cached: unknown,
): boolean {
  if (!Array.isArray(serverData) || !Array.isArray(cached)) return false;
  if (serverData.length === 0 || cached.length === 0) return false;
  const cachedQty = new Map<string, number>();
  for (const row of cached) {
    if (!isPlainObject(row) || typeof row.id !== "string") continue;
    if (!("quantity" in row)) return false;
    cachedQty.set(row.id, Math.max(0, Number(row.quantity ?? 0)));
  }
  if (cachedQty.size === 0) return false;
  let compared = false;
  let serverLower = false;
  let serverHigher = false;
  for (const row of serverData) {
    if (!isPlainObject(row) || typeof row.id !== "string") continue;
    if (!("quantity" in row)) continue;
    const prev = cachedQty.get(row.id);
    if (prev == null) continue;
    compared = true;
    const next = Math.max(0, Number(row.quantity ?? 0));
    if (next < prev) serverLower = true;
    if (next > prev) serverHigher = true;
  }
  // Only trust SSR when it is a pure shrink vs cache (never when any row grew).
  return compared && serverLower && !serverHigher;
}

/**
 * Detects status/payment / linkedOrder* fingerprint inequality between SSR and cache.
 * Does NOT prove SSR is newer — `resolveSsrSyncAction` must compare updatedAt before apply
 * (REQ-0136 idle harden: equal/missing timestamps → skip so soft-nav cannot clobber patches).
 */
export function listHasFresherStatusBadges(
  serverData: unknown,
  cached: unknown,
): boolean {
  if (!Array.isArray(serverData) || !Array.isArray(cached)) return false;
  const cachedById = new Map<string, string>();
  for (const row of cached) {
    const fp = rowStatusBadgeFingerprint(row);
    if (fp && isPlainObject(row) && typeof row.id === "string") {
      cachedById.set(row.id, fp);
    }
  }
  for (const row of serverData) {
    const serverFp = rowStatusBadgeFingerprint(row);
    if (!serverFp || !isPlainObject(row) || typeof row.id !== "string") {
      continue;
    }
    const cachedFp = cachedById.get(row.id);
    if (cachedFp != null && cachedFp !== serverFp) {
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
 * REQ-0136: while invalidated/fetching NEVER apply SSR — soft-nav RSC can
 * lag the client patch (prod badge revert). Densify/badge apply exceptions caused flash-back.
 * listHasFresherStatusBadges detects fingerprint inequality only; idle apply requires
 * serverAt > cachedAt (REQ-0136).
 */
export function resolveSsrSyncAction<T>(
  serverData: T,
  cached: T | undefined,
  state: SsrQueryStateHint | undefined,
): SsrSyncAction {
  // After CRUD invalidate, keep patched badges; let refetch settle from API/Redis.
  // Applying full RSC here reintroduced stale status/payment on production soft-nav.
  // REQ-0225 — when SSR has densify the thin mutation cache lacks (creator/supplier object),
  // gap-fill immediately then refetch (avoids late audit/supplier remount on detail soft-nav).
  if (state?.isInvalidated || state?.fetchStatus === "fetching") {
    if (
      cached !== undefined &&
      serverHasRicherDensify(serverData, cached)
    ) {
      return "applyDensifyOnly";
    }
    // REQ-0225 — stock shrink: apply lower SSR qty immediately (avoids 40→10 flash),
    // then caller still refetches while invalidated to settle densify/meta.
    if (
      cached !== undefined &&
      listHasLowerAllocationQuantities(serverData, cached)
    ) {
      return "apply";
    }
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
    if (listHasFresherStatusBadges(serverData, cached)) {
      // REQ-0136 — only apply when SSR is strictly newer by updatedAt.
      // Equal/missing timestamps: keep patched cache (stale soft-nav RSC often matches).
      if (serverAt != null && cachedAt != null && serverAt > cachedAt) {
        return "apply";
      }
      return "skip";
    }
    if (serverAt != null && cachedAt != null) {
      if (cachedAt > serverAt) {
        return "skip";
      }
      if (serverAt > cachedAt) {
        return "apply";
      }
      // Equal timestamps — lists stay skip unless badge fields already handled above
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

  // Equal timestamps (or both null) — prefer richer densify SSR (REQ-0202).
  // Freshness is NOT proven here (no updatedAt to compare), so the caller must only
  // gap-fill densify fields (REQ-0136 Fix B) — never replace the whole cached entity.
  if (
    cached !== undefined &&
    (serverAt === cachedAt || (serverAt == null && cachedAt == null)) &&
    serverHasRicherDensify(serverData, cached)
  ) {
    return "applyDensifyOnly";
  }

  if (serverAt != null && cachedAt != null && cachedAt >= serverAt) {
    return "skip";
  }

  if (cached !== undefined) {
    return "skip";
  }

  return "apply";
}

/**
 * REQ-0136 Fix B — merge helpers for the "apply" / "applyDensifyOnly" actions.
 * A raw `setQueryData(key, serverData)` replace can silently drop fields the cached
 * row has but the SSR snapshot omits (thin PUT/create responses), or — worse — let a
 * stale-but-differently-shaped SSR object win on fields it should never touch. Both
 * merge functions always keep `cached` as the base and only bring in `serverData`
 * according to the trust level the resolver already established.
 */

function mergeEntityOverlay(
  serverData: unknown,
  cached: unknown,
): unknown {
  if (!isPlainObject(serverData) || !isPlainObject(cached)) {
    return serverData;
  }
  return { ...cached, ...serverData };
}

/** Full overlay merge for "apply" — server proven fresher (or cache empty/absent). */
export function mergeSsrIntoCache<T>(serverData: T, cached: T | undefined): T {
  if (cached === undefined) return serverData;
  if (Array.isArray(serverData) && Array.isArray(cached)) {
    const cachedById = new Map<string, unknown>();
    for (const row of cached) {
      if (isPlainObject(row) && typeof row.id === "string") {
        cachedById.set(row.id, row);
      }
    }
    return serverData.map((row) => {
      if (!isPlainObject(row) || typeof row.id !== "string") return row;
      const cachedRow = cachedById.get(row.id);
      return cachedRow === undefined ? row : mergeEntityOverlay(row, cachedRow);
    }) as T;
  }
  return mergeEntityOverlay(serverData, cached) as T;
}

/**
 * Gap-fill merge for "applyDensifyOnly" — only copies DENSIFY_KEY_RE fields the cache
 * currently lacks; every other cached field (status, paymentStatus, statusAt, etc.)
 * survives untouched even if the SSR snapshot disagrees on it.
 */
export function mergeDensifyOnly<T>(serverData: T, cached: T): T {
  if (!isPlainObject(serverData) || !isPlainObject(cached)) {
    return cached;
  }
  const next: Record<string, unknown> = { ...cached };
  for (const key of Object.keys(serverData)) {
    if (!DENSIFY_KEY_RE.test(key)) continue;
    const serverVal = serverData[key];
    if (!densifyValuePresent(serverVal)) continue;
    const cachedVal = next[key];
    if (!densifyValuePresent(cachedVal)) {
      next[key] = serverVal;
      continue;
    }
    // Upgrade thin string placeholders (create/PUT) when SSR has object densify
    if (typeof cachedVal === "string" && isPlainObject(serverVal)) {
      next[key] = serverVal;
    }
  }
  return next as T;
}
