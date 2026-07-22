/**
 * Role-scoped TanStack warm prefetch after login (REQ-0025, REQ-0093).
 * Runs in background — does not block navigation; complements SSR + localStorage persist.
 *
 * Client: skips admin catalog list keys (uses portal browse APIs on /products).
 * Batched prefetch (4 concurrent) reduces idle network spike for admin.
 */

import type { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "./config";

type WarmUser = { id: string; role: string | null };

const WARM_BATCH_SIZE = 4;
const WARM_STALE_MS = 1000 * 60 * 5;

type PrefetchTask = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
};

/** Run TanStack prefetchQuery tasks in parallel batches. */
async function prefetchBatched(
  queryClient: QueryClient,
  tasks: PrefetchTask[],
  batchSize = WARM_BATCH_SIZE,
): Promise<void> {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((task) =>
        queryClient.prefetchQuery({
          queryKey: task.queryKey,
          queryFn: task.queryFn,
          staleTime: WARM_STALE_MS,
        }),
      ),
    );
  }
}

/**
 * Role → TanStack query keys warmed after login (REQ-0093).
 * Shared: orders + notifications (all roles).
 * Admin/user: full catalog + dashboard + admin lists.
 * Supplier: catalog + supplier portal.
 * Client: portal browse (no admin catalog lists).
 */
function buildWarmTasks(user: WarmUser): PrefetchTask[] {
  const role = user.role ?? "user";
  const tasks: PrefetchTask[] = [];

  const add = (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => {
    tasks.push({ queryKey, queryFn });
  };

  // Shared — every authenticated role
  add(queryKeys.orders.lists(), async () => {
    const r = await apiClient.orders.getAll();
    return r.data;
  });
  add(queryKeys.notifications.list({ limit: 20 }), async () => {
    const r = await apiClient.notifications.getAll({ limit: 20 });
    return r.data;
  });
  add(queryKeys.notifications.unreadCount(), async () => {
    const r = await apiClient.notifications.getUnreadCount();
    return r.data.count;
  });

  if (role === "admin" || role === "user") {
    add(queryKeys.products.lists(), async () => {
      const r = await apiClient.products.getAll();
      return r.data;
    });
    add(queryKeys.categories.lists(), async () => {
      const r = await apiClient.categories.getAll();
      return r.data;
    });
    add(queryKeys.suppliers.lists(), async () => {
      const r = await apiClient.suppliers.getAll();
      return r.data;
    });
    add(queryKeys.warehouses.lists(), async () => {
      const r = await apiClient.warehouses.getAll();
      return r.data;
    });
    add(queryKeys.dashboard.overview(user.id), async () => {
      const r = await apiClient.dashboard.getOverview();
      return r.data;
    });
    add(queryKeys.admin.counts(), async () => {
      const r = await apiClient.admin.getCounts();
      return r.data;
    });
    add(queryKeys.supportTickets.lists(), async () => {
      const r = await apiClient.supportTickets.getAll();
      return r.data;
    });
    add(queryKeys.productReviews.lists(), async () => {
      const r = await apiClient.productReviews.getAll();
      return r.data;
    });
    // REQ-0159 — Self-only issuer list (matches /invoices SSR)
    add(queryKeys.invoices.list(undefined), async () => {
      const r = await apiClient.invoices.getAll();
      return r.data;
    });
    // client-orders / client-invoices: warm on / or /admin — see warmAdminClientPortalLists (REQ-0027)
  }

  if (role === "supplier") {
    add(queryKeys.products.lists(), async () => {
      const r = await apiClient.products.getAll();
      return r.data;
    });
    add(queryKeys.categories.lists(), async () => {
      const r = await apiClient.categories.getAll();
      return r.data;
    });
    add(queryKeys.suppliers.lists(), async () => {
      const r = await apiClient.suppliers.getAll();
      return r.data;
    });
    add(queryKeys.warehouses.lists(), async () => {
      const r = await apiClient.warehouses.getAll();
      return r.data;
    });
    add(queryKeys.portal.supplierDashboard(user.id), async () => {
      const r = await apiClient.portal.getSupplierDashboard();
      return r.data;
    });
  }

  if (role === "client") {
    add(queryKeys.invoices.list(undefined), async () => {
      const r = await apiClient.invoices.getAll();
      return r.data;
    });
    add(queryKeys.portal.clientDashboard(user.id), async () => {
      const r = await apiClient.portal.getClientDashboard();
      return r.data;
    });
    add(queryKeys.portal.clientCatalogDashboard(user.id), async () => {
      const r = await apiClient.portal.getClientCatalog();
      return r.data;
    });
  }

  return tasks;
}

/** Prefetch high-traffic list queries for the logged-in role. */
export async function warmQueriesForUser(
  queryClient: QueryClient,
  user: WarmUser,
): Promise<void> {
  const role = user.role ?? "user";
  const tasks = buildWarmTasks(user);
  await prefetchBatched(queryClient, tasks);

  // Client browse meta + default owner products (sequential — ownerId depends on meta)
  if (role === "client") {
    try {
      const metaRes = await apiClient.portal.getClientBrowseMeta();
      const meta = metaRes.data;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.portal.clientBrowseMeta(),
        queryFn: async () => meta,
        staleTime: WARM_STALE_MS,
      });
      const admins = meta.admins ?? [];
      const preferred =
        admins.find((a) => a.email === "test@admin.com") ?? admins[0];
      const ownerId = preferred?.id ?? "";
      if (ownerId) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.portal.clientBrowseProducts({ ownerId }),
          queryFn: async () => {
            const r = await apiClient.portal.getClientBrowseProducts({ ownerId });
            return r.data;
          },
          staleTime: WARM_STALE_MS,
        });
      }
    } catch {
      // Browse warm is best-effort
    }
  }
}

/**
 * Admin client-portal list warm — deferred until user visits `/` or `/admin` (REQ-0027).
 */
export async function warmAdminClientPortalLists(
  queryClient: QueryClient,
): Promise<void> {
  await prefetchBatched(queryClient, [
    {
      queryKey: queryKeys.clientOrders.lists(),
      queryFn: async () => {
        const r = await apiClient.admin.getClientOrders();
        return r.data;
      },
    },
    {
      queryKey: queryKeys.clientInvoices.list(undefined),
      queryFn: async () => {
        const r = await apiClient.admin.getClientInvoices();
        return r.data;
      },
    },
  ]);
}
