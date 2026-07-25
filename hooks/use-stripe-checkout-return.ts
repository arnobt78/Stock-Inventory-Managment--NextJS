/**
 * REQ-0209 — Stripe return fallback (client).
 * Prefer SSR `reconcileStripeReturnBeforeDetail` + redirect (no Pending flash).
 * This hook covers cancelled return + edge cases where query params remain.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { markStripeCheckoutReturn } from "@/lib/payments/stripe-return";
import {
  invalidateAfterOrderGraphChange,
  queryKeys,
} from "@/lib/react-query";
import type { Order } from "@/types";

export type UseStripeCheckoutReturnOptions = {
  entityId: string;
  entity: "order" | "invoice";
};

export function useStripeCheckoutReturn({
  entityId,
  entity,
}: UseStripeCheckoutReturnOptions): void {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const ranForSession = useRef<string | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (
      !entityId ||
      !payment ||
      (payment !== "success" && payment !== "cancelled")
    ) {
      return;
    }

    markStripeCheckoutReturn();

    const detailKey =
      entity === "order"
        ? queryKeys.orders.detail(entityId)
        : queryKeys.invoices.detail(entityId);

    const cleanUrl = () => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("payment");
      next.delete("session_id");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    };

    const runInvalidations = () => {
      invalidateAfterOrderGraphChange(queryClient);
      void queryClient.refetchQueries({ queryKey: detailKey });
    };

    if (payment === "cancelled") {
      runInvalidations();
      cleanUrl();
      return;
    }

    // Success fallback if SSR reconcile did not redirect (soft client confirm)
    if (sessionId && ranForSession.current !== sessionId) {
      ranForSession.current = sessionId;

      // Instant UI: if Partial/Paid already in cache, bump Confirmed before network
      if (entity === "order") {
        queryClient.setQueryData<Order>(detailKey, (old) => {
          if (!old) return old;
          if (
            old.status === "pending" &&
            (old.paymentStatus === "partial" || old.paymentStatus === "paid")
          ) {
            return { ...old, status: "confirmed" };
          }
          return old;
        });
      }

      void apiClient.payments
        .confirmSession(sessionId)
        .then((res) => {
          if (entity === "order" && res.data) {
            queryClient.setQueryData<Order>(detailKey, (old) =>
              old
                ? {
                    ...old,
                    status: (res.data.orderStatus as Order["status"]) ?? old.status,
                    paymentStatus:
                      (res.data.paymentStatus as Order["paymentStatus"]) ??
                      old.paymentStatus,
                  }
                : old,
            );
          }
          runInvalidations();
          cleanUrl();
        })
        .catch(() => {
          runInvalidations();
          cleanUrl();
        });
    }
  }, [entityId, entity, queryClient, searchParams, router, pathname]);
}
