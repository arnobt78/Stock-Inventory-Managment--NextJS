"use client";

/**
 * Background warm prefetch after auth session is valid (REQ-0025).
 * Fills TanStack cache so subsequent navigations hit cache before RSC round-trip.
 * REQ-0027: admin client-orders/invoices warm deferred until `/` or `/admin` visit.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import {
  warmQueriesForUser,
  warmAdminClientPortalLists,
} from "@/lib/react-query/warm-route-prefetch";

function scheduleIdle(cb: () => void): void {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(cb);
  } else {
    setTimeout(cb, 0);
  }
}

export function RouteWarmPrefetch() {
  const { user, isLoggedIn, isCheckingAuth } = useAuth();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const warmedForRef = useRef<string | null>(null);
  const adminClientListsWarmedRef = useRef(false);

  useEffect(() => {
    if (isCheckingAuth || !isLoggedIn || !user?.id) return;
    if (warmedForRef.current === user.id) return;
    warmedForRef.current = user.id;

    // Defer until after first paint — avoids login API storm competing with home RSC (REQ-0026).
    scheduleIdle(() => {
      void warmQueriesForUser(queryClient, {
        id: user.id,
        role: user.role ?? null,
      });
    });
  }, [isCheckingAuth, isLoggedIn, user?.id, user?.role, queryClient]);

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
