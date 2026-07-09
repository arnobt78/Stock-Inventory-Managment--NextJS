"use client";

/**
 * Consumes deferred login welcome / logout goodbye payloads after full-page navigation.
 * Mounted in root layout so toasts fire once Toaster is ready (post-redirect).
 * useLayoutEffect fires before paint so welcome appears with the dashboard shell.
 */

import { useLayoutEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  clearPostLoginWelcome,
  getPostLoginWelcome,
  markPostLoginWelcomeShown,
  wasPostLoginWelcomeShown,
  POST_LOGIN_WELCOME_SHOWN_KEY,
} from "@/lib/auth/post-login-welcome";
import {
  clearPostLogoutGoodbye,
  getPostLogoutGoodbye,
  markPostLogoutGoodbyeShown,
  wasPostLogoutGoodbyeShown,
} from "@/lib/auth/post-logout-goodbye";

export function AuthSessionToasts() {
  const { toast } = useToast();
  const consumedRef = useRef(false);

  useLayoutEffect(() => {
    if (consumedRef.current) return;

    if (!wasPostLogoutGoodbyeShown()) {
      const goodbye = getPostLogoutGoodbye();
      if (goodbye) {
        consumedRef.current = true;
        markPostLogoutGoodbyeShown();
        clearPostLogoutGoodbye();
        toast({
          title: `Goodbye, ${goodbye.userName}! 👋`,
          description:
            "You have been logged out successfully. See you soon!",
        });
        return;
      }
    }

    if (!wasPostLoginWelcomeShown()) {
      const welcome = getPostLoginWelcome();
      if (welcome) {
        consumedRef.current = true;
        markPostLoginWelcomeShown();
        clearPostLoginWelcome();
        toast({
          title: `Welcome back, ${welcome.userName}! 👋`,
          description: "You have successfully logged in. Enjoy your stay!",
        });
      }
    }
  }, [toast]);

  return null;
}

/** Clear welcome shown-marker on logout so next login can toast again. */
export function clearAuthToastMarkers(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_LOGIN_WELCOME_SHOWN_KEY);
    clearPostLoginWelcome();
  } catch {
    // ignore
  }
}
