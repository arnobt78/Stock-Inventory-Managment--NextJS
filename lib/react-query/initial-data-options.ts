/**
 * TanStack Query options for SSR-passed initialData (REQ-0021).
 * Use on first render so hooks are not isPending when server data exists.
 */
export function withInitialData<T>(initialData?: T) {
  if (initialData === undefined) return {};
  return {
    initialData,
    initialDataUpdatedAt: Date.now(),
    // SSR data is fresh — skip immediate client refetch on mount (REQ-0024 perf).
    refetchOnMount: false,
  } as const;
}
