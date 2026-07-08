/**
 * TanStack Query options for SSR-passed initialData (REQ-0021).
 * Use on first render so hooks are not isPending when server data exists.
 */
export function withInitialData<T>(initialData?: T) {
  if (initialData === undefined) return {};
  return {
    initialData,
    initialDataUpdatedAt: Date.now(),
  } as const;
}
