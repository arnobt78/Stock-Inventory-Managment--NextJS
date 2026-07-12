"use client";

/**
 * Background warm prefetch after auth session is valid (REQ-0025, REQ-0093).
 * Phase 1: TanStack API cache (role-scoped, batched).
 * Phase 2: Next.js RSC prefetch for navbar paths (staggered, non-blocking).
 * REQ-0027: admin client-orders/invoices warm deferred until `/` or `/admin` visit.
 */

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { getNavPathsForRole } from "@/lib/navigation/role-nav-config";
import {
  warmQueriesForUser,
  warmAdminClientPortalLists,
} from "@/lib/react-query/warm-route-prefetch";

const RSC_PREFETCH_STAGGER_MS = 50;

function scheduleIdle(cb: () => void): void {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(cb);
  } else {
    setTimeout(cb, 0);
  }
}

/** Stagger router.prefetch so RSC warm does not burst the network. */
async function prefetchNavRoutes(
  router: ReturnType<typeof useRouter>,
  role: string | null | undefined,
): Promise<void> {
  const paths = getNavPathsForRole(role);
  for (const path of paths) {
    try {
      router.prefetch(path);
    } catch {
      // Best-effort — prefetch failures must not block UI
    }
    if (RSC_PREFETCH_STAGGER_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, RSC_PREFETCH_STAGGER_MS));
    }
  }
}

export function RouteWarmPrefetch() {
  const { user, isLoggedIn, isCheckingAuth } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const warmedForRef = useRef<string | null>(null);
  const adminClientListsWarmedRef = useRef(false);

  // Reset warm guards on logout so re-login re-warms after queryClient.clear()
  useEffect(() => {
    if (!isLoggedIn) {
      warmedForRef.current = null;
      adminClientListsWarmedRef.current = false;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isCheckingAuth || !isLoggedIn || !user?.id) return;

    const warmKey = `${user.id}:${user.role ?? "user"}`;
    if (warmedForRef.current === warmKey) return;
    warmedForRef.current = warmKey;

    // Defer until after first paint — login/dashboard not blocked (REQ-0026)
    scheduleIdle(() => {
      void (async () => {
        await warmQueriesForUser(queryClient, {
          id: user.id,
          role: user.role ?? null,
        });
        await prefetchNavRoutes(router, user.role);
      })();
    });
  }, [isCheckingAuth, isLoggedIn, user?.id, user?.role, queryClient, router]);

  useEffect(() => {
    if (isCheckingAuth || !isLoggedIn || !user?.id) return;
    const role = user.role ?? "user";
    if (role !== "admin" && role !== "user") return;
    if (adminClientListsWarmedRef.current) return;

    const onAdminHome =
      pathname === "/" || pathname.startsWith("/admin");
    if (!onAdminHome) return;

    adminClientListsWarmedRef.current = true;
    scheduleIdle(() => {
      void warmAdminClientPortalLists(queryClient);
    });
  }, [
    isCheckingAuth,
    isLoggedIn,
    user?.id,
    user?.role,
    pathname,
    queryClient,
  ]);

  return null;
}
