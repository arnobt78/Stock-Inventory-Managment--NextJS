/**
 * REQ-0122/0123 — Patch TanStack cache on mutation success before invalidate.
 * Order: patchDetailCache / patchListCaches → invalidate* (network refetch confirms server).
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "./config";

/** Write a single entity into its detail query key (instant detail-page numbers). */
export function patchDetailCache<T>(
  queryClient: QueryClient,
  detailKey: QueryKey,
  entity: T,
): void {
  queryClient.setQueryData<T>(detailKey, entity);
}

type Identifiable = { id: string };

function mergeRowInArray<T extends Identifiable>(
  rows: T[],
  entity: T,
  prependIfMissing: boolean,
): T[] | null {
  const index = rows.findIndex((row) => row.id === entity.id);
  if (index >= 0) {
    const next = [...rows];
    next[index] = { ...next[index], ...entity };
    return next;
  }
  if (prependIfMissing) {
    return [entity, ...rows];
  }
  return null;
}

/**
 * Merge `entity` into every cached list query under `listKeyRoot`.
 * Uses shallow merge so partial API rows still update visible columns (qty, status, name).
 */
export function patchListCaches<T extends Identifiable>(
  queryClient: QueryClient,
  listKeyRoot: QueryKey,
  entity: T,
  options?: { prependIfMissing?: boolean },
): void {
  const queries = queryClient.getQueriesData<T[]>({
    queryKey: listKeyRoot,
    exact: false,
  });

  for (const [key, data] of queries) {
    if (!Array.isArray(data)) continue;
    const next = mergeRowInArray(data, entity, options?.prependIfMissing ?? false);
    if (next) {
      queryClient.setQueryData(key, next);
    }
  }
}

/** Patch order + invoice list caches (admin + client-scoped keys). REQ-0123 */
export function patchOrderGraphListCaches<T extends Identifiable>(
  queryClient: QueryClient,
  entity: T,
  options?: { prependIfMissing?: boolean },
): void {
  patchListCaches(queryClient, queryKeys.orders.all, entity, options);
  patchListCaches(queryClient, queryKeys.clientOrders.all, entity, options);
  patchListCaches(queryClient, queryKeys.invoices.all, entity, options);
  patchListCaches(queryClient, queryKeys.clientInvoices.all, entity, options);
}

/**
 * Patch product rows in portal browse caches (nested `{ products: [] }` or plain arrays).
 * Skips portal dashboard objects that are not product lists.
 */
export function patchProductInPortalCaches<T extends Identifiable>(
  queryClient: QueryClient,
  product: T,
): void {
  const queries = queryClient.getQueriesData<unknown>({
    queryKey: queryKeys.portal.all,
    exact: false,
  });

  for (const [key, data] of queries) {
    if (Array.isArray(data)) {
      const next = mergeRowInArray(data as T[], product, false);
      if (next) {
        queryClient.setQueryData(key, next);
      }
      continue;
    }
    if (
      data &&
      typeof data === "object" &&
      "products" in data &&
      Array.isArray((data as { products: unknown }).products)
    ) {
      const wrapped = data as { products: T[] } & Record<string, unknown>;
      const nextProducts = mergeRowInArray(wrapped.products, product, false);
      if (nextProducts) {
        queryClient.setQueryData(key, { ...wrapped, products: nextProducts });
      }
    }
  }
}

/** Remove one row from all list caches under `listKeyRoot` (hard delete). */
export function removeFromListCaches(
  queryClient: QueryClient,
  listKeyRoot: QueryKey,
  entityId: string,
): void {
  const queries = queryClient.getQueriesData<Identifiable[]>({
    queryKey: listKeyRoot,
    exact: false,
  });

  for (const [key, data] of queries) {
    if (!Array.isArray(data)) continue;
    const filtered = data.filter((row) => row.id !== entityId);
    if (filtered.length !== data.length) {
      queryClient.setQueryData(key, filtered);
    }
  }
}

/**
 * Remove product from portal browse caches (hard delete). REQ-0123
 */
export function removeProductFromPortalCaches(
  queryClient: QueryClient,
  productId: string,
): void {
  const queries = queryClient.getQueriesData<unknown>({
    queryKey: queryKeys.portal.all,
    exact: false,
  });

  for (const [key, data] of queries) {
    if (Array.isArray(data)) {
      const filtered = (data as Identifiable[]).filter((row) => row.id !== productId);
      if (filtered.length !== data.length) {
        queryClient.setQueryData(key, filtered);
      }
      continue;
    }
    if (
      data &&
      typeof data === "object" &&
      "products" in data &&
      Array.isArray((data as { products: unknown }).products)
    ) {
      const wrapped = data as { products: Identifiable[] } & Record<string, unknown>;
      const filtered = wrapped.products.filter((row) => row.id !== productId);
      if (filtered.length !== wrapped.products.length) {
        queryClient.setQueryData(key, { ...wrapped, products: filtered });
      }
    }
  }
}

/** Patch or append one allocation row in product/warehouse stock caches. */
export function patchStockAllocationInCaches(
  queryClient: QueryClient,
  allocation: Identifiable & { productId?: string; warehouseId?: string },
  keys: {
    byProduct: (productId: string) => QueryKey;
    byWarehouse: (warehouseId: string) => QueryKey;
  },
): void {
  const upsertInArray = (key: QueryKey, rows: Identifiable[] | undefined) => {
    if (!Array.isArray(rows)) {
      queryClient.setQueryData(key, [allocation]);
      return;
    }
    const index = rows.findIndex((row) => row.id === allocation.id);
    if (index < 0) {
      queryClient.setQueryData(key, [...rows, allocation]);
      return;
    }
    const next = [...rows];
    next[index] = { ...next[index], ...allocation };
    queryClient.setQueryData(key, next);
  };

  if (allocation.productId) {
    const key = keys.byProduct(allocation.productId);
    upsertInArray(key, queryClient.getQueryData(key) as Identifiable[] | undefined);
  }
  if (allocation.warehouseId) {
    const key = keys.byWarehouse(allocation.warehouseId);
    upsertInArray(key, queryClient.getQueryData(key) as Identifiable[] | undefined);
  }
}

/** Remove one allocation row from product/warehouse stock caches (delete). */
export function removeStockAllocationFromCaches(
  queryClient: QueryClient,
  allocationId: string,
  keys: {
    byProduct: (productId: string) => QueryKey;
    byWarehouse: (warehouseId: string) => QueryKey;
  },
  scope?: { productId?: string; warehouseId?: string },
): void {
  const removeFrom = (key: QueryKey) => {
    const rows = queryClient.getQueryData<Identifiable[]>(key);
    if (!Array.isArray(rows)) return;
    const filtered = rows.filter((row) => row.id !== allocationId);
    if (filtered.length !== rows.length) {
      queryClient.setQueryData(key, filtered);
    }
  };

  if (scope?.productId) {
    removeFrom(keys.byProduct(scope.productId));
  }
  if (scope?.warehouseId) {
    removeFrom(keys.byWarehouse(scope.warehouseId));
  }
}
