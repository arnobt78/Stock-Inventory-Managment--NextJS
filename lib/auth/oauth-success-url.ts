/**
 * REQ-0035 — detect and clean Google OAuth success redirect query param.
 * Callback appends ?oauth_success=true on /, /client, or /supplier.
 */

/** Pure check for unit tests and browser (search string only). */
export function isOAuthSuccessSearch(search: string): boolean {
  try {
    return new URLSearchParams(search).get("oauth_success") === "true";
  } catch {
    return false;
  }
}

/** True when the current URL indicates a fresh OAuth login redirect. */
export function isOAuthSuccessRedirect(): boolean {
  if (typeof window === "undefined") return false;
  return isOAuthSuccessSearch(window.location.search);
}

/** Build pathname + search with oauth_success removed (pure; testable in Node). */
export function buildPathWithoutOAuthSuccess(
  pathname: string,
  search: string,
): string {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    params.delete("oauth_success");
    const query = params.toString();
    return pathname + (query ? `?${query}` : "");
  } catch {
    return pathname;
  }
}

/** Remove oauth_success from the address bar without navigation (keeps pathname). */
export function stripOAuthSuccessFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    if (!isOAuthSuccessSearch(window.location.search)) return;
    const next = buildPathWithoutOAuthSuccess(
      window.location.pathname,
      window.location.search,
    );
    window.history.replaceState(
      { ...window.history.state, as: next, url: next },
      "",
      next,
    );
  } catch {
    // ignore
  }
}
