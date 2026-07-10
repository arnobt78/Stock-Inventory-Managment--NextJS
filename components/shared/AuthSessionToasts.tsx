"use client";

/**
 * Consumes deferred login welcome / logout goodbye payloads after full-page navigation.
 * REQ-0034 — mounted after Toaster so useToast listeners exist.
 * REQ-0035 — Google OAuth ?oauth_success=true welcome on /, /client, /supplier.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts";
import { useToast } from "@/hooks/use-toast";
import {
  buildWelcomePayloadFromUser,
  getWelcomeToastContent,
} from "@/lib/auth/auth-welcome-toast";
import {
  isOAuthSuccessRedirect,
  stripOAuthSuccessFromUrl,
} from "@/lib/auth/oauth-success-url";
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
  const { user, refreshSession } = useAuth();
  const consumedRef = useRef(false);
  const oauthWelcomeHandledRef = useRef(false);
  const oauthRefreshAttemptedRef = useRef(false);

  // Email/password login — sessionStorage payload set before window.location redirect.
  useEffect(() => {
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
        toast(getWelcomeToastContent(welcome));
      }
    }
  }, [toast]);

  // Google OAuth — callback redirects with ?oauth_success=true (no sessionStorage pre-set).
  useEffect(() => {
    if (oauthWelcomeHandledRef.current) return;
    if (!isOAuthSuccessRedirect()) return;

    if (wasPostLoginWelcomeShown()) {
      stripOAuthSuccessFromUrl();
      return;
    }

    const showOAuthWelcome = async () => {
      if (!user) {
        if (!oauthRefreshAttemptedRef.current) {
          oauthRefreshAttemptedRef.current = true;
          await refreshSession();
        }
        return;
      }

      oauthWelcomeHandledRef.current = true;
      markPostLoginWelcomeShown();
      const payload = buildWelcomePayloadFromUser(user);
      toast(getWelcomeToastContent(payload));
      stripOAuthSuccessFromUrl();
    };

    void showOAuthWelcome();
  }, [user, refreshSession, toast]);

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
