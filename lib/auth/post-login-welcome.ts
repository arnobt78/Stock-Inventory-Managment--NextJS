/**
 * Deferred welcome toast after full-page login redirect (REQ-0028).
 * Login stores payload; destination dashboard consumes on first paint.
 * Shown-marker survives React Strict Mode remount (consume-on-read caused missed toasts).
 */

export const POST_LOGIN_WELCOME_KEY = "stockly:post-login-welcome";
export const POST_LOGIN_WELCOME_SHOWN_KEY = "stockly:post-login-welcome-shown";

export type PostLoginWelcomePayload = {
  userName: string;
  role: string;
};

export function setPostLoginWelcome(payload: PostLoginWelcomePayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_LOGIN_WELCOME_SHOWN_KEY);
    sessionStorage.setItem(POST_LOGIN_WELCOME_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage unavailable — skip welcome deferral
  }
}

export function getPostLoginWelcome(): PostLoginWelcomePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POST_LOGIN_WELCOME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PostLoginWelcomePayload;
  } catch {
    return null;
  }
}

export function clearPostLoginWelcome(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_LOGIN_WELCOME_KEY);
  } catch {
    // ignore
  }
}

export function wasPostLoginWelcomeShown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(POST_LOGIN_WELCOME_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPostLoginWelcomeShown(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_LOGIN_WELCOME_SHOWN_KEY, "1");
  } catch {
    // ignore
  }
}

/** @deprecated Use getPostLoginWelcome + clearPostLoginWelcome in hook */
export function consumePostLoginWelcome(): PostLoginWelcomePayload | null {
  const payload = getPostLoginWelcome();
  if (payload) clearPostLoginWelcome();
  return payload;
}
