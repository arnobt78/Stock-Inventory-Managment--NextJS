"use client";

/**
 * Auth context: provides user, login state, and logout to the whole app.
 * On mount, restores session from localStorage (for fast UI) then validates via /api/auth/session.
 * On logout/login queryClient.clear() wipes ALL cached queries so the next user never sees stale data.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { getSessionClient } from "@/utils/auth.client";
import type { User, AuthContextType } from "@/types";
import { syncSentryUserFromAuth } from "@/lib/monitoring/sentry";

/** Context holding auth state and methods; consumed via useAuth(). */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Wraps the app in layout; children get access to useAuth() for user, isLoggedIn, logout, checkSession.
 */
export type AuthProviderProps = {
  children: React.ReactNode;
  /** SSR session from root layout — navbar avatar + role on first paint (REQ-0025). */
  initialUser?: User | null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialUser = null,
}) => {
  const queryClient = useQueryClient();
  // SSR user from layout when logged in; otherwise hydrate from localStorage after mount.
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialUser);
  const [user, setUser] = useState<User | null>(initialUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!initialUser);
  const [mounted, setMounted] = useState(false);

  /**
   * Clear all authentication data from state, storage, and query cache.
   * queryClient.clear() wipes every cached query (products, orders, invoices,
   * dashboard, portal, notifications, etc.) so the next user starts fresh.
   */
  const clearAuthData = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    Cookies.remove("session_id");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("getSession");
    localStorage.removeItem("prevUserId");
    localStorage.removeItem("stock-inventory-query-cache");
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    // Mark component as mounted
    queueMicrotask(() => setMounted(true));

    // Load cached auth state from localStorage after mount to prevent hydration errors
    const cachedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const cachedSession = localStorage.getItem("getSession");

    // SSR initialUser already set — skip localStorage overwrite on first mount.
    if (initialUser) {
      return;
    }

    if (cachedIsLoggedIn && cachedSession) {
      try {
        const parsed = JSON.parse(cachedSession);
        setUser({
          id: parsed.userId || parsed.id,
          name: parsed.userName || parsed.name,
          email: parsed.userEmail || parsed.email,
          image: parsed.image || parsed.picture || null, // Support both image and picture (backward compatibility)
          role: parsed.userRole ?? parsed.role ?? "user",
        });
        setIsLoggedIn(true);
      } catch (error) {
        // Invalid cached data, will check session from server
      }
    }
  }, [initialUser]);

  /**
   * Check if user has an active session
   * Can be called to force a session refresh
   * Memoized with useCallback to prevent unnecessary recreations
   */
  const checkSession = useCallback(async () => {
    try {
      // If localStorage already has a cached session (e.g. we just logged in),
      // skip the blocking isCheckingAuth state so the UI renders instantly
      // from cached data while we validate in the background.
      const hasCachedSession =
        !!initialUser || localStorage.getItem("isLoggedIn") === "true";
      if (!hasCachedSession) {
        setIsCheckingAuth(true);
      }

      const session = await getSessionClient();
      if (session) {
        const prevId = localStorage.getItem("prevUserId");
        if (prevId && prevId !== session.id) {
          queryClient.clear();
        }
        localStorage.setItem("prevUserId", session.id);

        setIsLoggedIn(true);
        setUser({
          id: session.id,
          name: session.name,
          email: session.email,
          image:
            session.image ||
            (session as { picture?: string }).picture ||
            undefined,
          role: (session as { role?: string }).role ?? "user",
        });
        localStorage.setItem("isAuth", "true");
        localStorage.setItem("isLoggedIn", "true");
        const existingToken = localStorage.getItem("token") || session.id;
        localStorage.setItem("token", existingToken);
        localStorage.setItem("getSession", JSON.stringify(session));
      } else {
        clearAuthData();
      }
    } finally {
      setIsCheckingAuth(false);
    }
  }, [clearAuthData, queryClient, initialUser]);

  /**
   * Force refresh session (useful after OAuth redirect)
   */
  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Only run after component is mounted
    if (!mounted) return;

    // Initialize local storage with default values if not already set
    if (localStorage.getItem("isAuth") === null) {
      localStorage.setItem("isAuth", "false");
    }
    if (localStorage.getItem("isLoggedIn") === null) {
      localStorage.setItem("isLoggedIn", "false");
    }
    if (localStorage.getItem("token") === null) {
      localStorage.setItem("token", "");
    }
    if (localStorage.getItem("getSession") === null) {
      localStorage.setItem("getSession", "");
    }
    if (localStorage.getItem("theme") === null) {
      localStorage.setItem("theme", "light");
    }
    if (localStorage.getItem("jiraBaseUrl") === null) {
      localStorage.setItem("jiraBaseUrl", "atlassian.net");
    }
    if (localStorage.getItem("captureCloudUrl") === null) {
      localStorage.setItem(
        "captureCloudUrl",
        "https://prod-capture.zephyr4jiracloud.com/capture",
      );
    }

    // Check if we're coming from OAuth redirect (URL has oauth_success=true)
    // If so, skip initial session check - it will be handled by the homepage's refreshSession
    // Use a more reliable check that works during SSR and client-side
    const isOAuthRedirect =
      typeof window !== "undefined" &&
      (window.location.search.includes("oauth_success=true") ||
        window.location.href.includes("oauth_success=true"));

    // Initial session check - skip if OAuth redirect (will be handled by refreshSession)
    if (!isOAuthRedirect) {
      checkSession();
    } else {
      // For OAuth redirect, set isCheckingAuth to false immediately
      // The homepage's refreshSession will handle the session check
      setIsCheckingAuth(false);
    }
  }, [mounted, checkSession]);

  // Attach Sentry user (id, email, role) on session changes; clear on logout.
  useEffect(() => {
    if (!mounted) return;
    syncSentryUserFromAuth(user);
  }, [mounted, user?.id, user?.email, user?.role, user?.name]);

  /**
   * Login function - authenticates user and sets session
   * @returns User data from login response
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      const result = response.data;
      const userData = {
        id: result.userId,
        name: result.userName,
        email: result.userEmail,
        role: result.userRole ?? "user",
      };

      // Wipe all cached queries from the previous session so the new user
      // never sees stale orders, invoices, products, dashboard cards, etc.
      queryClient.clear();

      setIsLoggedIn(true);
      setUser(userData);
      Cookies.set("session_id", result.sessionId);

      localStorage.setItem("isAuth", "true");
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("token", result.sessionId);
      localStorage.setItem("getSession", JSON.stringify(result));

      return userData;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout function - clears session and user data
   */
  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      clearAuthData();
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        isCheckingAuth,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
