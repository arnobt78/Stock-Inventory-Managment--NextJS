"use client";

/**
 * REQ-0069/0070 — Sync SSR props into TanStack cache on App Router navigation.
 * Bridges withInitialData + refetchOnMount when stale: fresh RSC wins; stale
 * router.back() snapshots never clobber post-CRUD TanStack cache.
 */
import { useLayoutEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  resolveSsrSyncAction,
  mergeSsrIntoCache,
  mergeDensifyOnly,
} from "@/lib/react-query/ssr-sync-policy";

export type SsrQuerySyncEntry<T = unknown> = {
  queryKey: QueryKey;
  serverData: T | undefined;
};

function syncSsrSnapshot<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: QueryKey,
  serverData: T,
): void {
  const state = queryClient.getQueryState<T>(queryKey) as
    | import("@/lib/react-query/ssr-sync-policy").SsrQueryStateHint
    | undefined;
  const cached = queryClient.getQueryData<T>(queryKey);
  const action = resolveSsrSyncAction(serverData, cached, state);

  if (action === "refetch") {
    void queryClient.refetchQueries({ queryKey });
    return;
  }
  if (action === "skip") {
    return;
  }
  if (action === "applyDensifyOnly") {
    // Gap-fill only — never let a stale-but-differently-shaped SSR object win on
    // fields the resolver did not prove fresher (REQ-0136 Fix B).
    queryClient.setQueryData(queryKey, mergeDensifyOnly(serverData, cached as T));
    return;
  }
  // apply — server proven fresher (or cache empty); merge keeps cached-only fields
  // that a thinner SSR/PUT response may omit instead of a blind full replace.
  queryClient.setQueryData(queryKey, mergeSsrIntoCache(serverData, cached));
}

/** Push one SSR snapshot into the query cache before paint (avoids stale flash). */
export function useSyncSsrQueryData<T>(
  queryKey: QueryKey,
  serverData: T | undefined,
): void {
  const queryClient = useQueryClient();
  const fingerprint = JSON.stringify({ key: queryKey, data: serverData });

  useLayoutEffect(() => {
    if (serverData === undefined) return;
    syncSsrSnapshot(queryClient, queryKey, serverData);
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
      syncSsrSnapshot(queryClient, queryKey, serverData);
    }
  }, [queryClient, fingerprint]);
}
