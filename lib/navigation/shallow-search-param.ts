/**
 * Shallow URL search-param updates without Next.js RSC refetch (REQ-0027).
 * Use when TanStack client cache already holds the data (e.g. client product owner).
 */
export function replaceShallowSearchParam(
  key: string,
  value: string | null | undefined,
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
