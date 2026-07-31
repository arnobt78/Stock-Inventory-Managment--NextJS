/**
 * REQ-0209 — Stripe return fallback (client).
 * Prefer SSR `reconcileStripeReturnBeforeDetail` + redirect (no Pending flash).
 * This hook covers cancelled return + edge cases where query params remain.
 * REQ-0215 — patch paid invoice/order statuses from confirm response before invalidate.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { markStripeCheckoutReturn } from "@/lib/payments/stripe-return";
import {
  invalidateAfterOrderGraphChange,
  patchDetailCacheMerge,
  patchLinkedInvoicesFromOrder,
  patchLinkedOrderFromInvoiceMoney,
  patchCommittedAfterOrderMoneySettle,
  queryKeys,
} from "@/lib/react-query";
import type { Invoice, Order } from "@/types";

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
          const data = res.data;
          if (!data) {
            runInvalidations();
            cleanUrl();
            return;
          }

          const nextStatus =
            (data.orderStatus as Order["status"]) ?? undefined;
          const nextPayment =
            (data.paymentStatus as Order["paymentStatus"]) ?? undefined;
          const nextInvoiceStatus =
            (data.invoiceStatus as Invoice["status"]) ?? undefined;

          if (entity === "order") {
            const prevCached = queryClient.getQueryData<Order>(detailKey);
            queryClient.setQueryData<Order>(detailKey, (old) =>
              old
                ? {
                    ...old,
                    status: nextStatus ?? old.status,
                    paymentStatus: nextPayment ?? old.paymentStatus,
                  }
                : old,
            );
            patchLinkedInvoicesFromOrder(queryClient, {
              orderId: entityId,
              status: nextStatus,
              paymentStatus: nextPayment,
            });
            // REQ-0221/0222 — clear reserved densify when pay fulfills pending order
            patchCommittedAfterOrderMoneySettle(queryClient, {
              orderId: entityId,
              prevOrder: prevCached ?? null,
              nextStatus: nextStatus ?? prevCached?.status,
              nextPaymentStatus: nextPayment ?? prevCached?.paymentStatus,
            });
            // REQ-0215 — remainder settle: patch linked order money + invoice status paid
            if (nextPayment === "paid") {
              const cached = queryClient.getQueryData<Order>(detailKey);
              const inv = cached?.invoiceForOrder;
              if (cached && inv?.id) {
                patchLinkedOrderFromInvoiceMoney(queryClient, {
                  id: inv.id,
                  orderId: entityId,
                  amountPaid: inv.amountPaid ?? cached.total,
                  amountDue: 0,
                  total: inv.total ?? cached.total,
                  status: nextInvoiceStatus ?? "paid",
                  invoiceNumber: inv.invoiceNumber,
                });
              }
            }
          } else {
            // Invoice detail return — patch invoice + linked order payment
            const invBefore = queryClient.getQueryData<Invoice>(detailKey);
            const orderIdHint = data.orderId ?? invBefore?.orderId;
            const prevOrder =
              orderIdHint != null
                ? (queryClient.getQueryData<Order>(
                    queryKeys.orders.detail(orderIdHint),
                  ) ??
                  queryClient.getQueryData<Order>(
                    queryKeys.clientOrders.detail(orderIdHint),
                  ))
                : null;

            patchDetailCacheMerge<Invoice>(queryClient, detailKey, (old) => {
              if (!old) return old;
              return {
                ...old,
                status: nextInvoiceStatus ?? old.status,
                amountDue:
                  nextInvoiceStatus === "paid" || nextPayment === "paid"
                    ? 0
                    : old.amountDue,
                linkedOrderPaymentStatus:
                  nextPayment ?? old.linkedOrderPaymentStatus,
                linkedOrderStatus: nextStatus ?? old.linkedOrderStatus,
              };
            });
            const inv = queryClient.getQueryData<Invoice>(detailKey);
            const orderId = data.orderId ?? inv?.orderId;
            if (orderId && nextPayment) {
              patchLinkedInvoicesFromOrder(queryClient, {
                orderId,
                status: nextStatus,
                paymentStatus: nextPayment,
              });
            }
            if (inv && orderId && nextPayment === "paid") {
              patchLinkedOrderFromInvoiceMoney(queryClient, {
                id: inv.id,
                orderId,
                amountPaid: inv.amountPaid,
                amountDue: 0,
                total: inv.total,
                status: nextInvoiceStatus ?? "paid",
                invoiceNumber: inv.invoiceNumber,
              });
            }
            // REQ-0222 — invoice-page Stripe return: densify reserved clear
            if (orderId) {
              patchCommittedAfterOrderMoneySettle(queryClient, {
                orderId,
                prevOrder: prevOrder ?? null,
                nextStatus: nextStatus ?? prevOrder?.status,
                nextPaymentStatus: nextPayment ?? prevOrder?.paymentStatus,
              });
            }
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
