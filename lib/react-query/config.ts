/**
 * TanStack Query configuration
 * Centralized QueryClient and query-key factory. Used by QueryProvider in layout;
 * all hooks in hooks/queries use these keys for cache invalidation (e.g. invalidateAllRelatedQueries).
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default query options
 * Applied to all queries unless overridden
 */
const defaultQueryOptions = {
  queries: {
    // 5 min staleTime: navigating between pages shows cached data instantly with
    // fewer API calls. After any CRUD, invalidateAllRelatedQueries() marks queries
    // stale and forces an immediate refetch for active queries, so UI always
    // reflects mutations regardless of staleTime.
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Cache time: unused data stays in cache for 10 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    // Retry failed requests 3 times
    retry: 3,
    // Retry delay increases exponentially
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus so returning to the tab gets fresh data
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
    // Retry delay for mutations
    retryDelay: 1000,
  },
};

/**
 * Create QueryClient instance
 * Singleton pattern - create once and reuse
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

/**
 * Query keys factory
 * Centralized query key generation for consistency
 */
export const queryKeys = {
  // Auth queries
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // Product queries
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Category queries
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },

  // Supplier queries
  suppliers: {
    all: ["suppliers"] as const,
    lists: () => [...queryKeys.suppliers.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.suppliers.lists(), filters] as const,
    details: () => [...queryKeys.suppliers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.suppliers.details(), id] as const,
  },

  // User queries
  user: {
    all: ["user"] as const,
    emailPreferences: () =>
      [...queryKeys.user.all, "email-preferences"] as const,
  },

  // Order queries
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Admin client orders (orders containing my products)
  clientOrders: {
    all: ["clientOrders"] as const,
    lists: () => [...queryKeys.clientOrders.all, "list"] as const,
    details: () => [...queryKeys.clientOrders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.clientOrders.details(), id] as const,
  },

  // Admin client invoices (invoices for orders containing my products)
  clientInvoices: {
    all: ["clientInvoices"] as const,
    lists: () => [...queryKeys.clientInvoices.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.clientInvoices.lists(), filters] as const,
    details: () => [...queryKeys.clientInvoices.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.clientInvoices.details(), id] as const,
  },

  // Notification queries
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, "unread-count"] as const,
    details: () => [...queryKeys.notifications.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.notifications.details(), id] as const,
  },

  // Invoice queries
  invoices: {
    all: ["invoices"] as const,
    lists: () => [...queryKeys.invoices.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    byOrder: (orderId: string) =>
      [...queryKeys.invoices.all, "order", orderId] as const,
  },

  // Warehouse queries
  warehouses: {
    all: ["warehouses"] as const,
    lists: () => [...queryKeys.warehouses.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.warehouses.lists(), filters] as const,
    details: () => [...queryKeys.warehouses.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.warehouses.details(), id] as const,
  },

  // Import History (Admin History) queries
  history: {
    all: ["history"] as const,
    lists: () => [...queryKeys.history.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.history.lists(), filters] as const,
    details: () => [...queryKeys.history.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.history.details(), id] as const,
  },

  // Support Tickets queries
  supportTickets: {
    all: ["supportTickets"] as const,
    lists: () => [...queryKeys.supportTickets.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.supportTickets.lists(), filters] as const,
    details: () => [...queryKeys.supportTickets.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.supportTickets.details(), id] as const,
  },

  // Product Reviews queries
  productReviews: {
    all: ["productReviews"] as const,
    lists: () => [...queryKeys.productReviews.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.productReviews.lists(), filters] as const,
    details: () => [...queryKeys.productReviews.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.productReviews.details(), id] as const,
    byProduct: (productId: string, status?: string) =>
      [...queryKeys.productReviews.all, "byProduct", productId, status ?? "approved"] as const,
    eligibility: (productId: string, orderId?: string) =>
      [...queryKeys.productReviews.all, "eligibility", productId, orderId ?? ""] as const,
  },

  // Dashboard (admin overview) queries — key by userId so cache is per-user (avoids showing previous user's data when persisted)
  dashboard: {
    all: ["dashboard"] as const,
    overview: (userId?: string) =>
      [...queryKeys.dashboard.all, "overview", userId ?? ""] as const,
  },

  // Admin sidebar counts (client orders, client invoices, support tickets, product reviews)
  admin: {
    all: ["admin"] as const,
    counts: () => [...queryKeys.admin.all, "counts"] as const,
  },

  // User Management (admin) queries
  userManagement: {
    all: ["userManagement"] as const,
    lists: () => [...queryKeys.userManagement.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.userManagement.lists(), filters] as const,
    details: () => [...queryKeys.userManagement.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.userManagement.details(), id] as const,
  },

  // Admin Client Portal queries
  clientPortal: {
    all: ["clientPortal"] as const,
    overview: () => [...queryKeys.clientPortal.all, "overview"] as const,
  },

  // Admin Supplier Portal queries
  supplierPortal: {
    all: ["supplierPortal"] as const,
    overview: () => [...queryKeys.supplierPortal.all, "overview"] as const,
  },

  // Stock Allocation queries
  stockAllocation: {
    all: ["stockAllocation"] as const,
    lists: () => [...queryKeys.stockAllocation.all, "list"] as const,
    summary: () => [...queryKeys.stockAllocation.all, "summary"] as const,
    byProduct: (productId: string) =>
      [...queryKeys.stockAllocation.all, "product", productId] as const,
    byWarehouse: (warehouseId: string) =>
      [...queryKeys.stockAllocation.all, "warehouse", warehouseId] as const,
  },

  // Forecasting queries
  forecasting: {
    all: ["forecasting"] as const,
    summary: () => [...queryKeys.forecasting.all, "summary"] as const,
  },

  // Portal queries
  portal: {
    all: ["portal"] as const,
    supplier: () => [...queryKeys.portal.all, "supplier"] as const,
    client: () => [...queryKeys.portal.all, "client"] as const,
    clientCatalog: () => [...queryKeys.portal.all, "client", "catalog"] as const,
    clientBrowseMeta: () =>
      [...queryKeys.portal.all, "client", "browse-meta"] as const,
    clientBrowseProducts: (params: {
      ownerId: string;
      supplierId?: string;
      categoryId?: string;
    }) =>
      [
        ...queryKeys.portal.all,
        "client",
        "browse-products",
        params.ownerId,
        params.supplierId ?? "all",
        params.categoryId ?? "all",
      ] as const,
  },

  // System Configuration queries
  systemConfig: {
    all: () => ["systemConfig"] as const,
  },

  // Audit Log queries
  auditLogs: {
    all: ["auditLogs"] as const,
    lists: () => [...queryKeys.auditLogs.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.auditLogs.lists(), filters] as const,
  },
} as const;
