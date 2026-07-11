"use client";

/**
 * REQ-0069/0070 — Sync SSR props into TanStack cache on App Router navigation.
 * Bridges withInitialData + refetchOnMount:false: fresh RSC payload wins over stale cache.
 *
 * Usage:
 * - useSyncSsrQueryData — one query key
 * - useSyncSsrQueryDataMany — 2+ keys in one layout effect
 * - Pass serverData: undefined to skip an entry
 * - Param-scoped keys (ownerId, view filter): only sync when SSR params match active hook params
 */
import { useLayoutEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

export type SsrQuerySyncEntry<T = unknown> = {
  queryKey: QueryKey;
  serverData: T | undefined;
};

/** Push one SSR snapshot into the query cache before paint (avoids stale flash). */
export function useSyncSsrQueryData<T>(
  queryKey: QueryKey,
  serverData: T | undefined,
): void {
  const queryClient = useQueryClient();
  const fingerprint = JSON.stringify({ key: queryKey, data: serverData });

  useLayoutEffect(() => {
    if (serverData === undefined) return;
    queryClient.setQueryData(queryKey, serverData);
  }, [queryClient, fingerprint]);
}

/** Batch SSR sync — fingerprint-only deps avoid re-sync on inline array identity churn. */
export function useSyncSsrQueryDataMany(
  entries: ReadonlyArray<SsrQuerySyncEntry>,
): void {
  const queryClient = useQueryClient();
  const fingerprint = entries
    .map((e) =>
      JSON.stringify({
        key: e.queryKey,
        data: e.serverData,
      }),
    )
    .join("|");

  useLayoutEffect(() => {
    for (const { queryKey, serverData } of entries) {
      if (serverData === undefined) continue;
      queryClient.setQueryData(queryKey, serverData);
    }
  }, [queryClient, fingerprint]);
}
