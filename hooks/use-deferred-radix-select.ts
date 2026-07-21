"use client";

/**
 * Safe mount gate for Radix Select (portal to document.body).
 * Prevents React removeChild errors when App Router navigates between pages
 * while a Select portal is mounting or unmounting (e.g. /products → /orders).
 *
 * REQ-0198 — Dialog open on the same route mounts Select immediately (no
 * placeholder flash). One-frame defer only when pathname changed since the
 * last stable Select (nav teardown race). Instant path is derived (no sync
 * setState in effect) to satisfy react-hooks/set-state-in-effect.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type UseDeferredRadixSelectOptions = {
  /** When false (e.g. table isLoading), unmount Select before skeleton swap */
  enabled?: boolean;
};

export type UseDeferredRadixSelectResult = {
  showSelect: boolean;
  /** Pass as React key on Select root to remount per route */
  selectRemountKey: string;
};

/**
 * REQ-0198 — true when we must wait one animation frame before showing Select
 * (pathname changed since last stable mount). False for first paint / same-route
 * dialog re-enable.
 */
export function shouldDeferRadixSelectMount(
  lastStablePathname: string | undefined,
  routeKey: string,
): boolean {
  return (
    lastStablePathname !== undefined && lastStablePathname !== routeKey
  );
}

/** Module-level so remounted gates after App Router nav still see prior path. */
let deferredSelectLastStablePathname: string | undefined;

/** Test-only reset for unit tests. */
export function __resetDeferredSelectLastPathnameForTests(): void {
  deferredSelectLastStablePathname = undefined;
}

export function useDeferredRadixSelect(
  options: UseDeferredRadixSelectOptions = {},
): UseDeferredRadixSelectResult {
  const { enabled = true } = options;
  const pathname = usePathname();
  const routeKey = pathname ?? "";
  /** Only used when deferring after a pathname change */
  const [routeStableAfterDefer, setRouteStableAfterDefer] = useState(false);
  const frameRef = useRef<number | null>(null);

  const needsDefer = shouldDeferRadixSelectMount(
    deferredSelectLastStablePathname,
    routeKey,
  );

  useLayoutEffect(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (!enabled) {
      return;
    }

    if (!needsDefer) {
      // Same route / first paint — mark path stable without setState (derived show)
      deferredSelectLastStablePathname = routeKey;
      return;
    }

    // Pathname changed — one frame so prior route Select portals tear down
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      deferredSelectLastStablePathname = routeKey;
      setRouteStableAfterDefer(true);
    });

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setRouteStableAfterDefer(false);
    };
  }, [routeKey, enabled, needsDefer]);

  // Instant when no defer needed; after nav wait for rAF flag
  const showSelect =
    enabled && (!needsDefer || routeStableAfterDefer);

  return { showSelect, selectRemountKey: routeKey };
}
