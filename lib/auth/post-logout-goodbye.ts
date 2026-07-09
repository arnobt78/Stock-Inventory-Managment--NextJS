/**
 * Deferred goodbye toast after full-page logout redirect to /login.
 * Navbar stores payload; login page (via AuthSessionToasts) consumes on first paint.
 */

export const POST_LOGOUT_GOODBYE_KEY = "stockly:post-logout-goodbye";
const POST_LOGOUT_GOODBYE_SHOWN_KEY = "stockly:post-logout-goodbye-shown";

export type PostLogoutGoodbyePayload = {
  userName: string;
};

export function setPostLogoutGoodbye(payload: PostLogoutGoodbyePayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_LOGOUT_GOODBYE_SHOWN_KEY);
    sessionStorage.setItem(POST_LOGOUT_GOODBYE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage unavailable
  }
}

export function getPostLogoutGoodbye(): PostLogoutGoodbyePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POST_LOGOUT_GOODBYE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PostLogoutGoodbyePayload;
  } catch {
    return null;
  }
}

export function clearPostLogoutGoodbye(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_LOGOUT_GOODBYE_KEY);
  } catch {
    // ignore
  }
}

export function wasPostLogoutGoodbyeShown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(POST_LOGOUT_GOODBYE_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPostLogoutGoodbyeShown(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_LOGOUT_GOODBYE_SHOWN_KEY, "1");
  } catch {
    // ignore
  }
}
