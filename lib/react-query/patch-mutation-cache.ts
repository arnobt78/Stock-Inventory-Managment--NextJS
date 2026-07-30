/**
 * REQ-0122/0123 — Patch TanStack cache on mutation success before invalidate.
 * Order: patchDetailCache / patchListCaches → invalidate* (network refetch confirms server).
 * REQ-0153 — patchLinkedOrderFromInvoiceMoney syncs order paymentStatus instantly on invoice money CRUD.
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "./config";
import { deriveOrderPaymentStatus } from "@/lib/payments/order-payment-from-amounts";

/** Minimal invoice shape for linked-order payment patch (REQ-0153). */
export type InvoiceMoneyPatchSource = {
  id: string;
  orderId?: string | null;
  amountPaid?: number | null;
  amountDue?: number | null;
  total?: number | null;
  status?: string | null;
  invoiceNumber?: string | null;
  paidAt?: string | Date | null;
  dueDate?: string | Date | null;
  sentAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

function toIsoOrNull(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Write a single entity into its detail query key (instant detail-page numbers). */
export function patchDetailCache<T>(
  queryClient: QueryClient,
  detailKey: QueryKey,
  entity: T,
): void {
  queryClient.setQueryData<T>(detailKey, entity);
}

/**
 * Functional merge into a detail cache key (optimistic updates).
 * REQ-0125 — DRY alternative to inline setQueryData in mutation onMutate.
 */
export function patchDetailCacheMerge<T>(
  queryClient: QueryClient,
  detailKey: QueryKey,
  merge: (old: T | undefined) => T | undefined,
): void {
  queryClient.setQueryData<T>(detailKey, (old) => {
    const next = merge(old);
    return next !== undefined ? next : old;
  });
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
 * REQ-0153 — Instantly patch linked order + invoice list badge from invoice money.
 * Call after patching the invoice row itself (onMutate / onSuccess / onError rollback).
 * Skips cancelled invoices; does not invent refunded order status.
 */
export function patchLinkedOrderFromInvoiceMoney(
  queryClient: QueryClient,
  invoice: InvoiceMoneyPatchSource,
): void {
  const orderId = invoice.orderId;
  if (!orderId) return;
  if (invoice.status === "cancelled") return;

  const amountPaid = Number(invoice.amountPaid ?? 0);
  const total = Number(invoice.total ?? 0);
  const amountDue =
    invoice.amountDue != null
      ? Math.max(0, Number(invoice.amountDue))
      : Math.max(0, total - amountPaid);
  const paymentStatus = deriveOrderPaymentStatus(amountPaid, total);

  const invoiceForOrder = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber ?? "",
    paidAt: toIsoOrNull(invoice.paidAt),
    createdAt: toIsoOrNull(invoice.createdAt) ?? undefined,
    dueDate: toIsoOrNull(invoice.dueDate) ?? undefined,
    amountDue,
    amountPaid,
    total,
    status: invoice.status ?? undefined,
    sentAt: toIsoOrNull(invoice.sentAt),
    cancelledAt: toIsoOrNull(invoice.cancelledAt),
    updatedAt: toIsoOrNull(invoice.updatedAt),
  };

  type OrderPatchRow = {
    id: string;
    paymentStatus: string;
    invoiceForOrder: typeof invoiceForOrder;
  };

  const orderPatch: OrderPatchRow = {
    id: orderId,
    paymentStatus,
    invoiceForOrder,
  };

  // Order lists + detail (admin + client-scoped)
  patchListCaches(queryClient, queryKeys.orders.all, orderPatch);
  patchListCaches(queryClient, queryKeys.clientOrders.all, orderPatch);

  patchDetailCacheMerge<{
    id: string;
    paymentStatus?: string;
    invoiceForOrder?: typeof invoiceForOrder;
  }>(queryClient, queryKeys.orders.detail(orderId), (old) =>
    old
      ? {
          ...old,
          paymentStatus,
          invoiceForOrder,
        }
      : undefined,
  );
  patchDetailCacheMerge<{
    id: string;
    paymentStatus?: string;
    invoiceForOrder?: typeof invoiceForOrder;
  }>(queryClient, queryKeys.clientOrders.detail(orderId), (old) =>
    old
      ? {
          ...old,
          paymentStatus,
          invoiceForOrder,
        }
      : undefined,
  );

  // First money on pending → Confirmed (REQ-0209) so invoice Order badge matches
  let orderStatus: string | undefined;
  const orderDetail = queryClient.getQueryData<{ status?: string }>(
    queryKeys.orders.detail(orderId),
  );
  orderStatus = orderDetail?.status;
  if (
    orderStatus === "pending" &&
    (paymentStatus === "paid" || paymentStatus === "partial")
  ) {
    orderStatus = "confirmed";
    const confirmPatch = { id: orderId, status: "confirmed" as const };
    patchListCaches(queryClient, queryKeys.orders.all, confirmPatch);
    patchListCaches(queryClient, queryKeys.clientOrders.all, confirmPatch);
    patchDetailCacheMerge<{ id: string; status?: string }>(
      queryClient,
      queryKeys.orders.detail(orderId),
      (old) => (old ? { ...old, status: "confirmed" } : undefined),
    );
  }

  // Invoice Order # status + payment badges (all linked invoices)
  patchLinkedInvoicesFromOrder(queryClient, {
    orderId,
    status: orderStatus,
    paymentStatus,
    updatedAt: toIsoOrNull(invoice.updatedAt),
  });
}

/** Linked invoice fields needed so Order table Invoice # does not flash empty. REQ-0210 */
export type OrderCancelLinkedInvoice = {
  id: string;
  invoiceNumber?: string | null;
  createdAt?: string | Date | null;
  amountPaid?: number | null;
  amountDue?: number | null;
  total?: number | null;
  paidAt?: string | Date | null;
  dueDate?: string | Date | null;
  sentAt?: string | Date | null;
  status?: string | null;
  cancelledAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

/** Order cancel payload — patches linked invoices by orderId (not order.id). REQ-0210 */
export type OrderCancelInvoicePatchSource = {
  id: string;
  status?: string | null;
  paymentStatus?: string | null;
  cancelledAt?: string | Date | null;
  updatedAt?: string | Date | null;
  invoiceForOrder?: OrderCancelLinkedInvoice | null;
};

/** Sync invoice Order # badges from any order status/payment change. REQ-0211 */
export type LinkedInvoiceOrderPatchSource = {
  orderId: string;
  status?: string | null;
  paymentStatus?: string | null;
  statusAt?: string | null;
  updatedAt?: string | null;
};

function collectInvoiceIdsForOrder(
  queryClient: QueryClient,
  orderId: string,
): Set<string> {
  const invoiceIds = new Set<string>();
  const listRoots = [queryKeys.invoices.all, queryKeys.clientInvoices.all];
  for (const listKeyRoot of listRoots) {
    const queries = queryClient.getQueriesData<
      Array<{ id: string; orderId?: string }> | { id: string; orderId?: string }
    >({ queryKey: listKeyRoot, exact: false });
    for (const [, data] of queries) {
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row?.orderId === orderId && row.id) invoiceIds.add(row.id);
        }
      } else if (
        data &&
        typeof data === "object" &&
        data.orderId === orderId &&
        data.id
      ) {
        invoiceIds.add(data.id);
      }
    }
  }

  for (const listKeyRoot of [queryKeys.orders.all, queryKeys.clientOrders.all]) {
    const queries = queryClient.getQueriesData<
      Array<{ id: string; invoiceForOrder?: { id?: string } | null }>
    >({ queryKey: listKeyRoot, exact: false });
    for (const [, data] of queries) {
      if (!Array.isArray(data)) continue;
      for (const row of data) {
        if (row?.id === orderId && row.invoiceForOrder?.id) {
          invoiceIds.add(row.invoiceForOrder.id);
        }
      }
    }
  }
  const orderDetail = queryClient.getQueryData<{
    invoiceForOrder?: { id?: string } | null;
  }>(queryKeys.orders.detail(orderId));
  if (orderDetail?.invoiceForOrder?.id) {
    invoiceIds.add(orderDetail.invoiceForOrder.id);
  }
  return invoiceIds;
}

/**
 * Patch invoice list/detail linkedOrder* from order fulfillment/payment.
 * Covers pending→delivered + unpaid→refunded (not only shipped/cancel).
 */
export function patchLinkedInvoicesFromOrder(
  queryClient: QueryClient,
  order: LinkedInvoiceOrderPatchSource,
): void {
  const orderId = order.orderId;
  if (!orderId) return;
  if (
    order.status == null &&
    order.paymentStatus == null &&
    order.statusAt == null
  ) {
    return;
  }

  const updatedAt =
    toIsoOrNull(order.updatedAt) ??
    toIsoOrNull(order.statusAt) ??
    new Date().toISOString();

  for (const invoiceId of collectInvoiceIdsForOrder(queryClient, orderId)) {
    const invoicePatch: {
      id: string;
      linkedOrderStatus?: string;
      linkedOrderPaymentStatus?: string;
      linkedOrderStatusAt?: string;
      updatedAt: string;
    } = { id: invoiceId, updatedAt };
    if (order.status != null) {
      invoicePatch.linkedOrderStatus = order.status;
    }
    if (order.paymentStatus != null) {
      invoicePatch.linkedOrderPaymentStatus = order.paymentStatus;
    }
    if (order.statusAt != null) {
      invoicePatch.linkedOrderStatusAt = order.statusAt;
    }

    patchListCaches(queryClient, queryKeys.invoices.all, invoicePatch);
    patchListCaches(queryClient, queryKeys.clientInvoices.all, invoicePatch);
    patchDetailCacheMerge<{
      id: string;
      linkedOrderStatus?: string | null;
      linkedOrderPaymentStatus?: string | null;
      linkedOrderStatusAt?: string | null;
      updatedAt?: string | null;
    }>(queryClient, queryKeys.invoices.detail(invoiceId), (old) =>
      old ? { ...old, ...invoicePatch } : undefined,
    );
    patchDetailCacheMerge<{
      id: string;
      linkedOrderStatus?: string | null;
      linkedOrderPaymentStatus?: string | null;
      linkedOrderStatusAt?: string | null;
      updatedAt?: string | null;
    }>(queryClient, queryKeys.clientInvoices.detail(invoiceId), (old) =>
      old ? { ...old, ...invoicePatch } : undefined,
    );
  }
}

/** Shippo label / manual tracking success — patch order + linked invoice badges. REQ-0211 */
export type OrderShippingPatchSource = {
  orderId: string;
  status?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  updatedAt?: string | null;
};

/**
 * Instant Shipped on order + invoice tables (invalidate-only left badges lagging).
 * Merges into existing densify; patches invoices by orderId → linkedOrderStatus.
 */
export function patchOrdersOnShipping(
  queryClient: QueryClient,
  shipping: OrderShippingPatchSource,
): void {
  const orderId = shipping.orderId;
  if (!orderId) return;

  const status = shipping.status ?? "shipped";
  const statusAt =
    toIsoOrNull(shipping.updatedAt) ?? new Date().toISOString();

  const orderPatch = {
    id: orderId,
    status,
    statusAt,
    shippedAt: statusAt,
    updatedAt: statusAt,
    trackingNumber: shipping.trackingNumber ?? undefined,
    trackingCarrier: shipping.trackingCarrier ?? undefined,
    trackingUrl: shipping.trackingUrl ?? undefined,
    labelUrl: shipping.labelUrl ?? undefined,
  };

  patchListCaches(queryClient, queryKeys.orders.all, orderPatch);
  patchListCaches(queryClient, queryKeys.clientOrders.all, orderPatch);
  patchDetailCacheMerge<{
    id: string;
    status?: string;
    statusAt?: string;
    shippedAt?: string | null;
    updatedAt?: string | null;
    trackingNumber?: string | null;
    trackingCarrier?: string | null;
    trackingUrl?: string | null;
    labelUrl?: string | null;
  }>(queryClient, queryKeys.orders.detail(orderId), (old) =>
    old ? { ...old, ...orderPatch } : undefined,
  );
  patchDetailCacheMerge<{
    id: string;
    status?: string;
    statusAt?: string;
    shippedAt?: string | null;
    updatedAt?: string | null;
    trackingNumber?: string | null;
    trackingCarrier?: string | null;
    trackingUrl?: string | null;
    labelUrl?: string | null;
  }>(queryClient, queryKeys.clientOrders.detail(orderId), (old) =>
    old ? { ...old, ...orderPatch } : undefined,
  );

  patchLinkedInvoicesFromOrder(queryClient, {
    orderId,
    status,
    statusAt,
    updatedAt: statusAt,
  });
}

/**
 * REQ-0210 — On order cancel/refund, patch invoice list + detail immediately.
 * `patchOrderGraphListCaches(order)` only matches invoice rows by order.id (never),
 * so Cancelled / Refunded badges stayed stale until slow refetch.
 */
export function patchInvoicesOnOrderCancel(
  queryClient: QueryClient,
  order: OrderCancelInvoicePatchSource,
): void {
  const orderId = order.id;
  if (!orderId) return;

  const cancelledAt =
    toIsoOrNull(order.cancelledAt) ?? new Date().toISOString();
  const statusAt = cancelledAt;
  const paymentStatus = order.paymentStatus ?? "refunded";
  const orderStatus = order.status ?? "cancelled";

  const invoiceIds = new Set<string>();
  if (order.invoiceForOrder?.id) {
    invoiceIds.add(order.invoiceForOrder.id);
  }

  const listRoots = [queryKeys.invoices.all, queryKeys.clientInvoices.all];
  for (const listKeyRoot of listRoots) {
    const queries = queryClient.getQueriesData<
      Array<{ id: string; orderId?: string }> | { id: string; orderId?: string }
    >({ queryKey: listKeyRoot, exact: false });
    for (const [, data] of queries) {
      // Lists are arrays; detail keys are single invoice objects
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row?.orderId === orderId && row.id) {
            invoiceIds.add(row.id);
          }
        }
      } else if (
        data &&
        typeof data === "object" &&
        data.orderId === orderId &&
        data.id
      ) {
        invoiceIds.add(data.id);
      }
    }
  }

  // Detail keys may hold invoice without list warm — scan known detail if order link known
  if (invoiceIds.size === 0 && order.invoiceForOrder?.id) {
    invoiceIds.add(order.invoiceForOrder.id);
  }

  for (const invoiceId of invoiceIds) {
    const invoicePatch = {
      id: invoiceId,
      status: "cancelled" as const,
      amountDue: 0,
      cancelledAt,
      statusAt,
      linkedOrderStatus: orderStatus,
      linkedOrderPaymentStatus: paymentStatus,
      linkedOrderStatusAt: statusAt,
      updatedAt: toIsoOrNull(order.updatedAt) ?? cancelledAt,
    };

    patchListCaches(queryClient, queryKeys.invoices.all, invoicePatch);
    patchListCaches(queryClient, queryKeys.clientInvoices.all, invoicePatch);

    patchDetailCacheMerge<{
      id: string;
      status?: string;
      amountDue?: number;
      cancelledAt?: string | null;
      statusAt?: string;
      linkedOrderStatus?: string | null;
      linkedOrderPaymentStatus?: string | null;
      linkedOrderStatusAt?: string | null;
      updatedAt?: string | null;
    }>(queryClient, queryKeys.invoices.detail(invoiceId), (old) =>
      old
        ? {
            ...old,
            ...invoicePatch,
          }
        : undefined,
    );
    patchDetailCacheMerge<{
      id: string;
      status?: string;
      amountDue?: number;
      cancelledAt?: string | null;
      statusAt?: string;
      linkedOrderStatus?: string | null;
      linkedOrderPaymentStatus?: string | null;
      linkedOrderStatusAt?: string | null;
      updatedAt?: string | null;
    }>(queryClient, queryKeys.clientInvoices.detail(invoiceId), (old) =>
      old
        ? {
            ...old,
            ...invoicePatch,
          }
        : undefined,
    );
  }

  // Merge invoiceForOrder — never replace with thin {id,status} (drops invoiceNumber → late INV#).
  type OrderRowWithInvoice = {
    id: string;
    invoiceForOrder?: OrderCancelLinkedInvoice | null;
    [key: string]: unknown;
  };

  const mergeOrderRowOnCancel = (row: OrderRowWithInvoice): OrderRowWithInvoice => {
    const prevInv = row.invoiceForOrder;
    const fromApi = order.invoiceForOrder;
    const linkedId = fromApi?.id ?? prevInv?.id;
    const mergedInvoice =
      linkedId != null
        ? {
            ...(prevInv ?? {}),
            ...(fromApi ?? {}),
            id: linkedId,
            invoiceNumber:
              fromApi?.invoiceNumber ?? prevInv?.invoiceNumber ?? "",
            createdAt:
              toIsoOrNull(fromApi?.createdAt) ??
              toIsoOrNull(prevInv?.createdAt) ??
              undefined,
            amountPaid: fromApi?.amountPaid ?? prevInv?.amountPaid ?? 0,
            total: fromApi?.total ?? prevInv?.total,
            status: "cancelled" as const,
            amountDue: 0,
            cancelledAt,
            updatedAt: toIsoOrNull(order.updatedAt) ?? cancelledAt,
          }
        : prevInv ?? null;

    return {
      ...row,
      status: orderStatus,
      paymentStatus,
      cancelledAt,
      statusAt,
      updatedAt: toIsoOrNull(order.updatedAt) ?? cancelledAt,
      ...(mergedInvoice ? { invoiceForOrder: mergedInvoice } : {}),
    };
  };

  for (const listKeyRoot of [queryKeys.orders.all, queryKeys.clientOrders.all]) {
    const queries = queryClient.getQueriesData<OrderRowWithInvoice[]>({
      queryKey: listKeyRoot,
      exact: false,
    });
    for (const [key, data] of queries) {
      if (!Array.isArray(data)) continue;
      let changed = false;
      const next = data.map((row) => {
        if (row?.id !== orderId) return row;
        changed = true;
        return mergeOrderRowOnCancel(row);
      });
      if (changed) queryClient.setQueryData(key, next);
    }
  }

  patchDetailCacheMerge<OrderRowWithInvoice>(
    queryClient,
    queryKeys.orders.detail(orderId),
    (old) => (old ? mergeOrderRowOnCancel(old) : undefined),
  );
  patchDetailCacheMerge<OrderRowWithInvoice>(
    queryClient,
    queryKeys.clientOrders.detail(orderId),
    (old) => (old ? mergeOrderRowOnCancel(old) : undefined),
  );
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

/** REQ-0218 — allocation row shape for transfer qty adjustments */
type AllocQtyRow = Identifiable & {
  productId?: string;
  warehouseId?: string;
  quantity?: number;
  reservedQuantity?: number;
};

/**
 * REQ-0218 — Adjust one allocation array by ±qty for a product@warehouse.
 * Clamps quantity to reserved floor; removes row when qty and reserved are 0.
 */
export function applyTransferQtyToAllocationRows(
  rows: AllocQtyRow[],
  match: { productId?: string; warehouseId?: string },
  deltaQty: number,
  createIfMissing: boolean,
): AllocQtyRow[] {
  const index = rows.findIndex((row) => {
    if (match.productId != null && row.productId !== match.productId) return false;
    if (match.warehouseId != null && row.warehouseId !== match.warehouseId) {
      return false;
    }
    return true;
  });

  if (index >= 0) {
    const next = [...rows];
    const row = next[index]!;
    const reserved = Math.max(0, Number(row.reservedQuantity ?? 0));
    const qty = Math.max(reserved, Number(row.quantity ?? 0) + deltaQty);
    if (qty <= 0 && reserved <= 0) {
      next.splice(index, 1);
      return next;
    }
    next[index] = { ...row, quantity: qty };
    return next;
  }

  if (createIfMissing && deltaQty > 0 && match.productId && match.warehouseId) {
    return [
      ...rows,
      {
        id: `optimistic-xfer-${match.productId}-${match.warehouseId}`,
        productId: match.productId,
        warehouseId: match.warehouseId,
        quantity: deltaQty,
        reservedQuantity: 0,
      },
    ];
  }
  return rows;
}

export type StockTransferPatchInput = {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
};

/**
 * REQ-0218 — Instantly move qty between warehouse/product allocation caches (then invalidate).
 */
export function patchStockCachesAfterTransfer(
  queryClient: QueryClient,
  transfer: StockTransferPatchInput,
  keys: {
    byProduct: (productId: string) => QueryKey;
    byWarehouse: (warehouseId: string) => QueryKey;
  },
): void {
  const qty = Math.max(0, Number(transfer.quantity) || 0);
  if (!qty || !transfer.productId) return;

  const patchKey = (
    key: QueryKey,
    match: { productId?: string; warehouseId?: string },
    delta: number,
    createIfMissing: boolean,
  ) => {
    const rows = queryClient.getQueryData<AllocQtyRow[]>(key);
    if (!Array.isArray(rows)) {
      if (createIfMissing && delta > 0 && match.productId && match.warehouseId) {
        queryClient.setQueryData(key, [
          {
            id: `optimistic-xfer-${match.productId}-${match.warehouseId}`,
            productId: match.productId,
            warehouseId: match.warehouseId,
            quantity: delta,
            reservedQuantity: 0,
          },
        ]);
      }
      return;
    }
    queryClient.setQueryData(
      key,
      applyTransferQtyToAllocationRows(rows, match, delta, createIfMissing),
    );
  };

  const { productId, fromWarehouseId, toWarehouseId } = transfer;
  patchKey(
    keys.byProduct(productId),
    { productId, warehouseId: fromWarehouseId },
    -qty,
    false,
  );
  patchKey(
    keys.byProduct(productId),
    { productId, warehouseId: toWarehouseId },
    qty,
    true,
  );
  patchKey(
    keys.byWarehouse(fromWarehouseId),
    { productId, warehouseId: fromWarehouseId },
    -qty,
    false,
  );
  patchKey(
    keys.byWarehouse(toWarehouseId),
    { productId, warehouseId: toWarehouseId },
    qty,
    true,
  );
}

export type WarehouseSummaryDelta = {
  warehouseId: string;
  quantityDelta: number;
  reservedDelta?: number;
  productsDelta?: number;
};

type WarehouseSummaryRow = {
  warehouseId: string;
  warehouseName?: string;
  totalProducts: number;
  totalQuantity: number;
  totalReserved: number;
  totalValue: number;
};

/**
 * REQ-0218 — Patch warehouse stock summary (list Stock share %) before invalidate.
 */
export function patchWarehouseStockSummaryCaches(
  queryClient: QueryClient,
  summaryKey: QueryKey,
  deltas: WarehouseSummaryDelta[],
): void {
  if (deltas.length === 0) return;
  const rows = queryClient.getQueryData<WarehouseSummaryRow[]>(summaryKey);
  if (!Array.isArray(rows)) return;

  const byId = new Map(deltas.map((d) => [d.warehouseId, d]));
  queryClient.setQueryData(
    summaryKey,
    rows.map((row) => {
      const d = byId.get(row.warehouseId);
      if (!d) return row;
      return {
        ...row,
        totalQuantity: Math.max(
          0,
          Number(row.totalQuantity) + d.quantityDelta,
        ),
        totalReserved: Math.max(
          0,
          Number(row.totalReserved) + (d.reservedDelta ?? 0),
        ),
        totalProducts: Math.max(
          0,
          Number(row.totalProducts) + (d.productsDelta ?? 0),
        ),
      };
    }),
  );
}

type CatalogCountRow = Identifiable & {
  productCount?: number;
  catalogProductTotal?: number;
};

/**
 * REQ-0218 — Instantly bump category/supplier list productCount (+ catalogProductTotal).
 * Create/delete: adjustCatalogTotal true. Move category/supplier: false (counts only).
 */
export function patchCatalogListProductCounts(
  queryClient: QueryClient,
  opts: {
    categoryId?: string | null;
    supplierId?: string | null;
    prevCategoryId?: string | null;
    prevSupplierId?: string | null;
    delta: 1 | -1;
    adjustCatalogTotal: boolean;
  },
): void {
  const totalDelta = opts.adjustCatalogTotal ? opts.delta : 0;

  const applyDomain = (
    listKeyRoot: QueryKey,
    nextId: string | null | undefined,
    prevId: string | null | undefined,
  ) => {
    const queries = queryClient.getQueriesData<CatalogCountRow[]>({
      queryKey: listKeyRoot,
      exact: false,
    });
    for (const [key, data] of queries) {
      if (!Array.isArray(data)) continue;
      let changed = false;
      const next = data.map((row) => {
        let productCount = Number(row.productCount ?? 0);
        let catalogProductTotal = row.catalogProductTotal;
        if (nextId && row.id === nextId) {
          productCount = Math.max(0, productCount + opts.delta);
          changed = true;
        }
        if (prevId && prevId !== nextId && row.id === prevId) {
          productCount = Math.max(0, productCount - opts.delta);
          changed = true;
        }
        if (totalDelta !== 0 && catalogProductTotal != null) {
          catalogProductTotal = Math.max(
            0,
            Number(catalogProductTotal) + totalDelta,
          );
          changed = true;
        }
        if (
          productCount === Number(row.productCount ?? 0) &&
          catalogProductTotal === row.catalogProductTotal
        ) {
          return row;
        }
        return {
          ...row,
          productCount,
          ...(catalogProductTotal != null ? { catalogProductTotal } : {}),
        };
      });
      if (changed) {
        queryClient.setQueryData(key, next);
      }
    }
  };

  applyDomain(
    queryKeys.categories.all,
    opts.categoryId,
    opts.prevCategoryId,
  );
  applyDomain(
    queryKeys.suppliers.all,
    opts.supplierId,
    opts.prevSupplierId,
  );
}
