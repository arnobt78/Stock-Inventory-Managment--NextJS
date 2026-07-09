/**
 * Role-scoped TanStack warm prefetch after login (REQ-0025).
 * Runs in background — does not block navigation; complements SSR + localStorage persist.
 */

import type { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "./config";

type WarmUser = { id: string; role: string | null };

/** Prefetch high-traffic list queries for the logged-in role. */
export async function warmQueriesForUser(
  queryClient: QueryClient,
  user: WarmUser,
): Promise<void> {
  const role = user.role ?? "user";
  const tasks: Array<Promise<unknown>> = [];

  const prefetch = <T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
  ) => {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 1000 * 60 * 5,
      }),
    );
  };

  prefetch(queryKeys.products.lists(), async () => {
    const r = await apiClient.products.getAll();
    return r.data;
  });
  prefetch(queryKeys.orders.lists(), async () => {
    const r = await apiClient.orders.getAll();
    return r.data;
  });
  prefetch(queryKeys.categories.lists(), async () => {
    const r = await apiClient.categories.getAll();
    return r.data;
  });
  prefetch(queryKeys.suppliers.lists(), async () => {
    const r = await apiClient.suppliers.getAll();
    return r.data;
  });
  prefetch(queryKeys.warehouses.lists(), async () => {
    const r = await apiClient.warehouses.getAll();
    return r.data;
  });

  prefetch(queryKeys.notifications.list({ limit: 20 }), async () => {
    const r = await apiClient.notifications.getAll({ limit: 20 });
    return r.data;
  });
  prefetch(queryKeys.notifications.unreadCount(), async () => {
    const r = await apiClient.notifications.getUnreadCount();
    return r.data.count;
  });

  if (role === "admin" || role === "user") {
    prefetch(queryKeys.dashboard.overview(user.id), async () => {
      const r = await apiClient.dashboard.getOverview();
      return r.data;
    });
    prefetch(queryKeys.admin.counts(), async () => {
      const r = await apiClient.admin.getCounts();
      return r.data;
    });
    prefetch(queryKeys.supportTickets.lists(), async () => {
      const r = await apiClient.supportTickets.getAll();
      return r.data;
    });
    prefetch(queryKeys.productReviews.lists(), async () => {
      const r = await apiClient.productReviews.getAll();
      return r.data;
    });
    // Match /invoices (store-wide) and issuer lists used by admin combined / personal pages
    prefetch(queryKeys.invoices.list({ scope: "store" }), async () => {
      const r = await apiClient.invoices.getAll({ scope: "store" });
      return r.data;
    });
    prefetch(queryKeys.invoices.list(undefined), async () => {
      const r = await apiClient.invoices.getAll();
      return r.data;
    });
    // client-orders / client-invoices: warm on / or /admin visit — see warmAdminClientPortalLists (REQ-0027)
  }

  if (role === "client") {
    prefetch(queryKeys.invoices.list(undefined), async () => {
      const r = await apiClient.invoices.getAll();
      return r.data;
    });
    prefetch([...queryKeys.portal.client(), user.id], async () => {
      const r = await apiClient.portal.getClientDashboard();
      return r.data;
    });
    prefetch([...queryKeys.portal.clientCatalog(), user.id], async () => {
      const r = await apiClient.portal.getClientCatalog();
      return r.data;
    });
    tasks.push(
      (async () => {
        try {
          const metaRes = await apiClient.portal.getClientBrowseMeta();
          const meta = metaRes.data;
          await queryClient.prefetchQuery({
            queryKey: queryKeys.portal.clientBrowseMeta(),
            queryFn: async () => meta,
            staleTime: 1000 * 60 * 5,
          });
          const admins = meta.admins ?? [];
          const preferred =
            admins.find((a) => a.email === "test@admin.com") ?? admins[0];
          const ownerId = preferred?.id ?? "";
          if (ownerId) {
            await queryClient.prefetchQuery({
              queryKey: queryKeys.portal.clientBrowseProducts({ ownerId }),
              queryFn: async () => {
                const r = await apiClient.portal.getClientBrowseProducts({
                  ownerId,
                });
                return r.data;
              },
              staleTime: 1000 * 60 * 5,
            });
          }
        } catch {
          // Browse warm is best-effort
        }
      })(),
    );
  }

  if (role === "supplier") {
    prefetch([...queryKeys.portal.supplier(), user.id], async () => {
      const r = await apiClient.portal.getSupplierDashboard();
      return r.data;
    });
  }

  await Promise.allSettled(tasks);
}

/**
 * Admin client-portal list warm — deferred until user visits `/` or `/admin` (REQ-0027).
 * Home/admin pages consume these; skipping on login trims ~2 heavy API calls.
 */
export async function warmAdminClientPortalLists(
  queryClient: QueryClient,
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [];

  const prefetch = <T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
  ) => {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 1000 * 60 * 5,
      }),
    );
  };

  prefetch(queryKeys.clientOrders.lists(), async () => {
    const r = await apiClient.admin.getClientOrders();
    return r.data;
  });
  prefetch(queryKeys.clientInvoices.list(undefined), async () => {
    const r = await apiClient.admin.getClientInvoices();
    return r.data;
  });

  await Promise.allSettled(tasks);
}
