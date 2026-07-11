"use client";

/**
 * REQ-0069 — Sync SSR props into TanStack cache on App Router navigation.
 * Bridges withInitialData + refetchOnMount:false: fresh RSC payload wins over stale cache.
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

  useLayoutEffect(() => {
    if (serverData === undefined) return;
    queryClient.setQueryData(queryKey, serverData);
  }, [queryClient, serverData, queryKey]);
}

/** Batch SSR sync for detail pages with multiple prefetched queries. */
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
  }, [queryClient, fingerprint, entries]);
}
