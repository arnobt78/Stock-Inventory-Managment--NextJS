/**
 * REQ-0122/0123 — Patch TanStack cache on mutation success before invalidate.
 * Order: patchDetailCache / patchListCaches → invalidate* (network refetch confirms server).
 * REQ-0153 — patchLinkedOrderFromInvoiceMoney syncs order paymentStatus instantly on invoice money CRUD.
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "./config";
import { deriveOrderPaymentStatus } from "@/lib/payments/order-payment-from-amounts";
import { computeCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";

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
/** REQ-0218 / REQ-0225 — allocation row shape for transfer/allocate qty + densify */
type AllocQtyRow = Identifiable & {
  productId?: string;
  warehouseId?: string;
  quantity?: number;
  reservedQuantity?: number;
  /** Nested densify used by warehouse row Catalog · Allocated · Reserved line */
  product?: {
    quantity?: number;
    allocatedTotal?: number;
    unallocated?: number;
    committedQuantity?: number;
    reservedQuantity?: number;
  } & Record<string, unknown>;
};

/**
 * Upsert one allocation into product + warehouse TanStack caches.
 * REQ-0225 — merge keeps reserved + nested product densify when PUT body is thinner;
 * then recompute Catalog · Allocated · Unallocated · Reserved across caches.
 */
export function patchStockAllocationInCaches(
  queryClient: QueryClient,
  allocation: Identifiable & {
    productId?: string;
    warehouseId?: string;
    quantity?: number;
    reservedQuantity?: number;
    product?: AllocQtyRow["product"];
  },
  keys: {
    byProduct: (productId: string) => QueryKey;
    byWarehouse: (warehouseId: string) => QueryKey;
  },
): void {
  const mergeRow = (
    prev: AllocQtyRow | undefined,
    incoming: typeof allocation,
  ): AllocQtyRow => {
    const reserved = Math.max(
      0,
      Number(
        incoming.reservedQuantity ?? prev?.reservedQuantity ?? 0,
      ),
    );
    const prevProduct = prev?.product;
    const nextProduct = incoming.product;
    const product =
      prevProduct || nextProduct
        ? {
            ...prevProduct,
            ...nextProduct,
            quantity: Number(
              nextProduct?.quantity ?? prevProduct?.quantity ?? 0,
            ),
            allocatedTotal: Number(
              nextProduct?.allocatedTotal ?? prevProduct?.allocatedTotal ?? 0,
            ),
            unallocated: Number(
              nextProduct?.unallocated ?? prevProduct?.unallocated ?? 0,
            ),
            committedQuantity: Math.max(
              Number(nextProduct?.committedQuantity ?? 0),
              Number(prevProduct?.committedQuantity ?? 0),
            ),
            reservedQuantity: Math.max(
              Number(nextProduct?.reservedQuantity ?? 0),
              Number(prevProduct?.reservedQuantity ?? 0),
              reserved,
            ),
          }
        : undefined;
    return {
      ...prev,
      ...incoming,
      reservedQuantity: reserved,
      ...(product ? { product } : {}),
    };
  };

  const upsertInArray = (key: QueryKey, rows: AllocQtyRow[] | undefined) => {
    if (!Array.isArray(rows)) {
      queryClient.setQueryData(key, [mergeRow(undefined, allocation)]);
      return;
    }
    const index = rows.findIndex((row) => row.id === allocation.id);
    if (index < 0) {
      const sibling = rows.find(
        (row) =>
          row.productId === allocation.productId && row.product != null,
      );
      queryClient.setQueryData(key, [
        ...rows,
        mergeRow(sibling, allocation),
      ]);
      return;
    }
    const next = [...rows];
    next[index] = mergeRow(rows[index], allocation);
    queryClient.setQueryData(key, next);
  };

  if (allocation.productId) {
    const key = keys.byProduct(allocation.productId);
    upsertInArray(
      key,
      queryClient.getQueryData(key) as AllocQtyRow[] | undefined,
    );
  }
  if (allocation.warehouseId) {
    const key = keys.byWarehouse(allocation.warehouseId);
    upsertInArray(
      key,
      queryClient.getQueryData(key) as AllocQtyRow[] | undefined,
    );
  }

  // Instant Catalog · Allocated · Unallocated · Reserved after allocate/edit
  if (allocation.productId) {
    const catalogQty = Number(
      allocation.product?.quantity ??
        queryClient.getQueryData<{ quantity?: number }>(
          queryKeys.products.detail(allocation.productId),
        )?.quantity ??
        0,
    );
    if (catalogQty > 0 || allocation.product?.quantity != null) {
      patchStockAllocationCatalogDensify(
        queryClient,
        allocation.productId,
        catalogQty,
        keys,
        allocation.warehouseId ? [allocation.warehouseId] : undefined,
      );
    }
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

/** Apply catalog densify fields onto matching allocation row product snapshots. */
function applyCatalogDensifyToAllocationRows(
  rows: AllocQtyRow[],
  productId: string,
  densify: {
    catalogQty: number;
    allocatedTotal: number;
    unallocated: number;
    committedQuantity: number;
  },
): AllocQtyRow[] {
  return rows.map((row) => {
    if (row.productId !== productId) return row;
    if (!row.product) {
      return {
        ...row,
        product: {
          quantity: densify.catalogQty,
          allocatedTotal: densify.allocatedTotal,
          unallocated: densify.unallocated,
          committedQuantity: densify.committedQuantity,
        },
      };
    }
    return {
      ...row,
      product: {
        ...row.product,
        quantity: densify.catalogQty,
        allocatedTotal: densify.allocatedTotal,
        unallocated: densify.unallocated,
        committedQuantity: densify.committedQuantity,
      },
    };
  });
}

/**
 * REQ-0225 — Sync nested product Catalog · Allocated · Unallocated · Reserved densify
 * on product + warehouse stock caches (qty increase or after shrink deducts).
 */
export function patchStockAllocationCatalogDensify(
  queryClient: QueryClient,
  productId: string,
  newCatalogQty: number,
  keys: {
    byProduct: (productId: string) => QueryKey;
    byWarehouse: (warehouseId: string) => QueryKey;
  },
  warehouseIds?: string[],
): void {
  if (!productId) return;
  const catalogQty = Math.max(0, Number(newCatalogQty) || 0);

  const productDetail = queryClient.getQueryData<{
    quantity?: number;
    reservedQuantity?: number | null;
    committedQuantity?: number;
    allocatedTotal?: number;
    unallocated?: number;
  }>(queryKeys.products.detail(productId));

  // Dedupe allocation qty by row id across product + warehouse caches (no double-count).
  const qtyByAllocId = new Map<string, number>();
  const reservedByAllocId = new Map<string, number>();
  const cacheKeysToPatch: QueryKey[] = [];

  for (const [key, rows] of queryClient.getQueriesData<AllocQtyRow[]>({
    queryKey: queryKeys.stockAllocation.all,
    exact: false,
  })) {
    if (!Array.isArray(rows)) continue;
    let touched = false;
    for (const row of rows) {
      if (row.productId !== productId || typeof row.id !== "string") continue;
      touched = true;
      qtyByAllocId.set(row.id, Math.max(0, Number(row.quantity ?? 0)));
      reservedByAllocId.set(
        row.id,
        Math.max(0, Number(row.reservedQuantity ?? 0)),
      );
    }
    if (touched) cacheKeysToPatch.push(key);
  }

  // Ensure explicit product/warehouse keys are included even if empty warm seed
  const productKey = keys.byProduct(productId);
  if (!cacheKeysToPatch.some((k) => JSON.stringify(k) === JSON.stringify(productKey))) {
    const productRows = queryClient.getQueryData<AllocQtyRow[]>(productKey);
    if (Array.isArray(productRows)) cacheKeysToPatch.push(productKey);
  }
  for (const warehouseId of warehouseIds ?? []) {
    const warehouseKey = keys.byWarehouse(warehouseId);
    if (
      !cacheKeysToPatch.some(
        (k) => JSON.stringify(k) === JSON.stringify(warehouseKey),
      )
    ) {
      const warehouseRows =
        queryClient.getQueryData<AllocQtyRow[]>(warehouseKey);
      if (Array.isArray(warehouseRows)) cacheKeysToPatch.push(warehouseKey);
    }
  }

  const allocatedTotal =
    qtyByAllocId.size > 0
      ? [...qtyByAllocId.values()].reduce((s, n) => s + n, 0)
      : Number(productDetail?.allocatedTotal ?? 0);
  const unallocated = Math.max(0, catalogQty - allocatedTotal);
  const allocReservedSum = [...reservedByAllocId.values()].reduce(
    (s, n) => s + n,
    0,
  );
  const productReserved = Number(productDetail?.reservedQuantity ?? 0);
  const committedQuantity = Math.max(
    computeCommittedQuantity(productReserved, allocReservedSum),
    Number(productDetail?.committedQuantity ?? 0),
  );

  const densify = {
    catalogQty,
    allocatedTotal,
    unallocated,
    committedQuantity,
  };

  for (const key of cacheKeysToPatch) {
    const rows = queryClient.getQueryData<AllocQtyRow[]>(key);
    if (!Array.isArray(rows)) continue;
    queryClient.setQueryData(
      key,
      applyCatalogDensifyToAllocationRows(rows, productId, densify),
    );
  }

  if (productDetail) {
    patchDetailCacheMerge(queryClient, queryKeys.products.detail(productId), (old) =>
      old
        ? {
            ...old,
            quantity: catalogQty,
            allocatedTotal,
            unallocated,
            committedQuantity,
          }
        : old,
    );
  }
}

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
    // Copy nested catalog densify from any sibling row for this product (avoids
    // Catalog · Allocated · Reserved null flash on destination warehouse).
    const sibling = rows.find(
      (row) => row.productId === match.productId && row.product != null,
    );
    return [
      ...rows,
      {
        id: `optimistic-xfer-${match.productId}-${match.warehouseId}`,
        productId: match.productId,
        warehouseId: match.warehouseId,
        quantity: deltaQty,
        reservedQuantity: 0,
        ...(sibling?.product ? { product: { ...sibling.product } } : {}),
      },
    ];
  }
  return rows;
}

/**
 * REQ-0225 — After catalog qty shrink, instantly apply allocation deducts in
 * product + warehouse stock caches (avoids warehouse detail 40→10 flash).
 * Also patches nested product Catalog · Allocated · Unallocated · Reserved densify.
 */
export function patchStockCachesAfterCatalogShrink(
  queryClient: QueryClient,
  productId: string,
  shrinkSteps: Array<{
    id: string;
    deduct: number;
    warehouseId?: string;
    productId?: string;
  }>,
  keys: {
    byProduct: (productId: string) => QueryKey;
    byWarehouse: (warehouseId: string) => QueryKey;
  },
  /** New catalog qty after PUT — required for unallocated densify */
  newCatalogQty?: number,
): void {
  if (!productId || shrinkSteps.length === 0) return;

  const applyDelta = (
    key: QueryKey,
    match: { productId?: string; warehouseId?: string; allocationId?: string },
    deltaQty: number,
  ) => {
    const rows = queryClient.getQueryData<AllocQtyRow[]>(key);
    if (!Array.isArray(rows)) return;
    const index = rows.findIndex((row) => {
      if (match.allocationId != null && row.id === match.allocationId) {
        return true;
      }
      if (match.productId != null && row.productId !== match.productId) {
        return false;
      }
      if (match.warehouseId != null && row.warehouseId !== match.warehouseId) {
        return false;
      }
      return match.productId != null || match.warehouseId != null;
    });
    if (index < 0) return;
    const next = applyTransferQtyToAllocationRows(
      rows,
      {
        productId: match.productId,
        warehouseId: match.warehouseId,
      },
      deltaQty,
      false,
    );
    // Prefer id match when present — re-apply by id for correctness
    if (match.allocationId) {
      const byId = [...rows];
      const i = byId.findIndex((r) => r.id === match.allocationId);
      if (i < 0) return;
      const row = byId[i]!;
      const reserved = Math.max(0, Number(row.reservedQuantity ?? 0));
      const qty = Math.max(reserved, Number(row.quantity ?? 0) + deltaQty);
      if (qty <= 0 && reserved <= 0) {
        byId.splice(i, 1);
      } else {
        byId[i] = { ...row, quantity: qty };
      }
      queryClient.setQueryData(key, byId);
      return;
    }
    queryClient.setQueryData(key, next);
  };

  const touchedWarehouseIds = new Set<string>();

  for (const step of shrinkSteps) {
    const deduct = Math.max(0, Number(step.deduct) || 0);
    if (deduct <= 0) continue;
    const delta = -deduct;
    const productKey = keys.byProduct(productId);
    applyDelta(
      productKey,
      { productId, allocationId: step.id, warehouseId: step.warehouseId },
      delta,
    );
    if (!step.warehouseId) continue;
    touchedWarehouseIds.add(step.warehouseId);
    const warehouseKey = keys.byWarehouse(step.warehouseId);
    const warehouseCached = queryClient.getQueryData<AllocQtyRow[]>(warehouseKey);
    // Warm path: warehouse detail never visited → no cache; seed from product rows
    // so soft-nav to warehouse paints shrunk qty (not pre-shrink 40→10 flash).
    if (!Array.isArray(warehouseCached)) {
      const productRows = queryClient.getQueryData<AllocQtyRow[]>(productKey);
      if (Array.isArray(productRows) && productRows.length > 0) {
        const seeded = productRows.filter(
          (row) =>
            row.warehouseId === step.warehouseId || row.id === step.id,
        );
        if (seeded.length > 0) {
          queryClient.setQueryData(warehouseKey, seeded);
        }
      }
      continue;
    }
    applyDelta(
      warehouseKey,
      {
        productId,
        warehouseId: step.warehouseId,
        allocationId: step.id,
      },
      delta,
    );
  }

  // Sync Catalog · Allocated · Unallocated · Reserved densify after qty deducts
  const catalogQty =
    newCatalogQty ??
    queryClient.getQueryData<{ quantity?: number }>(
      queryKeys.products.detail(productId),
    )?.quantity;
  if (catalogQty != null) {
    patchStockAllocationCatalogDensify(
      queryClient,
      productId,
      Number(catalogQty),
      keys,
      [...touchedWarehouseIds],
    );
  }

  // REQ-0225 — also sync warehouse stock summary (stock share % in warehouse list table)
  // after a catalog shrink so the % column updates without waiting for a full refetch.
  if (touchedWarehouseIds.size > 0) {
    const summaryKey = queryKeys.stockAllocation.summary();
    const summaryRows = queryClient.getQueryData<WarehouseSummaryRow[]>(summaryKey);
    if (Array.isArray(summaryRows)) {
      const deltas: WarehouseSummaryDelta[] = [];
      for (const warehouseId of touchedWarehouseIds) {
        // Compute the actual new totalQuantity from the patched cache instead of a delta
        // so we don't accumulate rounding errors on repeated shrinks.
        const whRows = queryClient.getQueryData<AllocQtyRow[]>(
          keys.byWarehouse(warehouseId),
        );
        if (!Array.isArray(whRows)) continue;
        const newTotal = whRows.reduce(
          (s, r) => s + Math.max(0, Number(r.quantity ?? 0)),
          0,
        );
        const summaryRow = summaryRows.find((s) => s.warehouseId === warehouseId);
        if (!summaryRow) continue;
        const prevTotal = Number(summaryRow.totalQuantity ?? 0);
        if (newTotal !== prevTotal) {
          deltas.push({ warehouseId, quantityDelta: newTotal - prevTotal });
        }
      }
      if (deltas.length > 0) {
        patchWarehouseStockSummaryCaches(queryClient, summaryKey, deltas);
      }
    }
  }
}

/** REQ-0218 — transfer patch input for instant allocation qty moves */
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

  const { productId, fromWarehouseId, toWarehouseId } = transfer;

  // Prefer densify snapshot from source warehouse before qty moves
  const sourceRows = queryClient.getQueryData<AllocQtyRow[]>(
    keys.byWarehouse(fromWarehouseId),
  );
  const sourceProduct = Array.isArray(sourceRows)
    ? sourceRows.find((r) => r.productId === productId)?.product
    : undefined;

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
            ...(sourceProduct ? { product: { ...sourceProduct } } : {}),
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

  // Seed densify onto dest if create-if-missing built a thin row without product
  if (sourceProduct) {
    for (const key of [
      keys.byWarehouse(toWarehouseId),
      keys.byProduct(productId),
    ]) {
      const rows = queryClient.getQueryData<AllocQtyRow[]>(key);
      if (!Array.isArray(rows)) continue;
      let changed = false;
      const next = rows.map((row) => {
        if (row.productId !== productId || row.product != null) return row;
        changed = true;
        return { ...row, product: { ...sourceProduct } };
      });
      if (changed) queryClient.setQueryData(key, next);
    }
  }

  const catalogQty = Number(
    sourceProduct?.quantity ??
      queryClient.getQueryData<{ quantity?: number }>(
        queryKeys.products.detail(productId),
      )?.quantity ??
      0,
  );
  patchStockAllocationCatalogDensify(
    queryClient,
    productId,
    catalogQty,
    keys,
    [fromWarehouseId, toWarehouseId],
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

/** REQ-0221 — signed reserved/committed adjustment for product list + detail. */
export type ProductCommittedDelta = {
  productId: string;
  reservedDelta: number;
};

type OrderCommittedSnapshot = {
  status?: string;
  paymentStatus?: string;
  items?: Array<{ productId: string; quantity: number; warehouseId?: string | null }>;
};

function aggregateLineDeltas(
  items: Array<{ productId: string; quantity: number }> | undefined,
  sign: 1 | -1,
): ProductCommittedDelta[] {
  if (!items?.length) return [];
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.productId) continue;
    const qty = Number(item.quantity) || 0;
    if (!qty) continue;
    map.set(item.productId, (map.get(item.productId) ?? 0) + sign * qty);
  }
  return [...map.entries()].map(([productId, reservedDelta]) => ({
    productId,
    reservedDelta,
  }));
}

/**
 * REQ-0221 — map order create / fulfill / cancel to committedQuantity deltas.
 * Create (+); pending → non-pending/paid fulfill (−); pending cancel (−).
 */
export function resolveOrderCommittedDeltas(
  prev: OrderCommittedSnapshot | null | undefined,
  next: OrderCommittedSnapshot,
): ProductCommittedDelta[] {
  const items =
    next.items && next.items.length > 0 ? next.items : (prev?.items ?? []);
  if (!items.length) return [];

  if (!prev) {
    return aggregateLineDeltas(items, 1);
  }

  const wasPending = prev.status === "pending";
  const nextCancelled = next.status === "cancelled";
  const prevCancelled = prev.status === "cancelled";

  if (wasPending && nextCancelled && !prevCancelled) {
    return aggregateLineDeltas(items, -1);
  }

  const leftPending =
    wasPending &&
    next.status !== "pending" &&
    next.status !== "cancelled";
  const paidWhilePending =
    wasPending &&
    prev.paymentStatus !== "paid" &&
    next.paymentStatus === "paid";

  if (leftPending || paidWhilePending) {
    return aggregateLineDeltas(items, -1);
  }

  return [];
}

type ProductCommittedRow = Identifiable & {
  committedQuantity?: number;
  reservedQuantity?: number;
};

/**
 * REQ-0221 — instant product list/detail reserved densify before order-graph invalidate.
 */
export function patchProductCommittedCaches(
  queryClient: QueryClient,
  deltas: ProductCommittedDelta[],
): void {
  const byId = new Map<string, number>();
  for (const d of deltas) {
    if (!d.productId || !d.reservedDelta) continue;
    byId.set(d.productId, (byId.get(d.productId) ?? 0) + d.reservedDelta);
  }
  if (byId.size === 0) return;

  const applyRow = <T extends ProductCommittedRow>(row: T): T => {
    const delta = byId.get(row.id);
    if (delta == null) return row;
    const prev =
      typeof row.committedQuantity === "number"
        ? row.committedQuantity
        : Math.max(0, Number(row.reservedQuantity ?? 0));
    return {
      ...row,
      committedQuantity: Math.max(0, prev + delta),
    };
  };

  const listQueries = queryClient.getQueriesData<ProductCommittedRow[]>({
    queryKey: queryKeys.products.all,
    exact: false,
  });
  for (const [key, data] of listQueries) {
    if (!Array.isArray(data)) continue;
    let changed = false;
    const next = data.map((row) => {
      const patched = applyRow(row);
      if (patched !== row) changed = true;
      return patched;
    });
    if (changed) queryClient.setQueryData(key, next);
  }

  for (const productId of byId.keys()) {
    const detailKey = queryKeys.products.detail(productId);
    const detail = queryClient.getQueryData<ProductCommittedRow>(detailKey);
    if (detail) {
      queryClient.setQueryData(detailKey, applyRow(detail));
    }
  }

  // Portal browse nested products
  const portalQueries = queryClient.getQueriesData<unknown>({
    queryKey: queryKeys.portal.all,
    exact: false,
  });
  for (const [key, data] of portalQueries) {
    if (Array.isArray(data)) {
      let changed = false;
      const next = (data as ProductCommittedRow[]).map((row) => {
        const patched = applyRow(row);
        if (patched !== row) changed = true;
        return patched;
      });
      if (changed) queryClient.setQueryData(key, next);
      continue;
    }
    if (
      data &&
      typeof data === "object" &&
      "products" in data &&
      Array.isArray((data as { products: unknown }).products)
    ) {
      const wrapped = data as {
        products: ProductCommittedRow[];
      } & Record<string, unknown>;
      let changed = false;
      const nextProducts = wrapped.products.map((row) => {
        const patched = applyRow(row);
        if (patched !== row) changed = true;
        return patched;
      });
      if (changed) {
        queryClient.setQueryData(key, { ...wrapped, products: nextProducts });
      }
    }
  }
}

/**
 * REQ-0221 / REQ-0225 — instant allocation reservedQuantity + nested product.committedQuantity
 * patch when order is created (sign +1), cancelled, or fulfilled (sign -1).
 * Prevents the "15 reserved" flash after cancel/pay on WarehouseDetailPage.
 * Called alongside patchProductCommittedCaches in use-orders hooks.
 *
 * Strategy: patch reservedQuantity per (productId, warehouseId), then in a single final
 * pass set product.committedQuantity on ALL allocation rows for each productId from the
 * product detail cache (already updated by patchProductCommittedCaches). This avoids the
 * intermediate 5→6 flash caused by per-item incremental arithmetic.
 */
export function patchAllocationReservedCaches(
  queryClient: QueryClient,
  items: Array<{
    productId: string;
    quantity: number;
    warehouseId?: string | null;
  }>,
  sign: 1 | -1,
): void {
  // Step 1 — collect unique productIds for the final committed sync pass
  const affectedProductIds = new Set<string>();

  for (const item of items) {
    const { productId, warehouseId } = item;
    if (!productId) continue;
    const qty = Number(item.quantity) || 0;
    if (!qty) continue;
    affectedProductIds.add(productId);
    const delta = sign * qty;

    const applyReservedDelta = <
      T extends { productId?: string; warehouseId?: string; reservedQuantity?: number; product?: Record<string, unknown> },
    >(
      row: T,
      matchProductId: string,
      matchWarehouseId?: string | null,
    ): T => {
      const productMatch = row.productId === matchProductId;
      const warehouseMatch =
        !matchWarehouseId || row.warehouseId === matchWarehouseId;
      if (!productMatch || !warehouseMatch) return row;
      const prevReserved = Number(row.reservedQuantity ?? 0);
      const nextReserved = Math.max(0, prevReserved + delta);
      return {
        ...row,
        reservedQuantity: nextReserved,
        // product.committedQuantity will be synced in the final pass below — skip here
        // to avoid intermediate wrong values causing extra renders
      };
    };

    // Patch byWarehouse cache (primary view on WarehouseDetailPage)
    if (warehouseId) {
      const whKey = queryKeys.stockAllocation.byWarehouse(warehouseId);
      const whRows = queryClient.getQueryData<AllocQtyRow[]>(whKey);
      if (Array.isArray(whRows)) {
        queryClient.setQueryData(
          whKey,
          whRows.map((r) => applyReservedDelta(r, productId, warehouseId)),
        );
      }
    }

    // Patch byProduct cache (secondary; ProductDetailPage pie chart)
    const prodKey = queryKeys.stockAllocation.byProduct(productId);
    const prodRows = queryClient.getQueryData<AllocQtyRow[]>(prodKey);
    if (Array.isArray(prodRows)) {
      queryClient.setQueryData(
        prodKey,
        prodRows.map((r) => applyReservedDelta(r, productId, warehouseId)),
      );
    }
  }

  // Step 2 — single final pass: set product.committedQuantity on ALL allocation rows
  // for each affected product using the already-correct product detail cache value.
  // This prevents the 5→6 flash caused by processing items one by one.
  for (const productId of affectedProductIds) {
    const detailCommitted = Number(
      queryClient.getQueryData<{ committedQuantity?: number }>(
        queryKeys.products.detail(productId),
      )?.committedQuantity ?? 0,
    );
    for (const [key, rows] of queryClient.getQueriesData<AllocQtyRow[]>({
      queryKey: queryKeys.stockAllocation.all,
      exact: false,
    })) {
      if (!Array.isArray(rows)) continue;
      const next = rows.map((row) => {
        if (row.productId !== productId || !row.product) return row;
        return {
          ...row,
          product: {
            ...row.product,
            committedQuantity: detailCommitted,
            reservedQuantity: Math.max(
              0,
              Number(row.reservedQuantity ?? 0),
            ),
          },
        };
      });
      // Only write back if something changed
      if (next.some((r, i) => r !== rows[i])) {
        queryClient.setQueryData(key, next);
      }
    }
  }
}

/**
 * REQ-0222 — money settle densify helper.
 * Call before invalidate when payment/status crosses fulfill boundary.
 * Checkout create must NOT call this (stock not fulfilled until Stripe settle).
 */
export function patchCommittedAfterOrderMoneySettle(
  queryClient: QueryClient,
  opts: {
    orderId?: string | null;
    /** Snapshot before money/status patch (preferred). */
    prevOrder?: OrderCommittedSnapshot | null;
    nextStatus?: string | null;
    nextPaymentStatus?: string | null;
  },
): void {
  const orderId = opts.orderId ?? null;
  const cached =
    orderId != null
      ? (queryClient.getQueryData<OrderCommittedSnapshot>(
          queryKeys.orders.detail(orderId),
        ) ??
        queryClient.getQueryData<OrderCommittedSnapshot>(
          queryKeys.clientOrders.detail(orderId),
        ))
      : null;

  const prev = opts.prevOrder ?? cached;
  if (!prev) return;

  const items =
    prev.items?.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      warehouseId: i.warehouseId ?? null,
    })) ?? [];

  const deltas = resolveOrderCommittedDeltas(prev, {
    status: opts.nextStatus ?? prev.status,
    paymentStatus: opts.nextPaymentStatus ?? prev.paymentStatus,
    items,
  });
  patchProductCommittedCaches(queryClient, deltas);
  // REQ-0225 — also release allocation reservedQuantity when fulfillment releases reservation
  if (deltas.some((d) => d.reservedDelta < 0)) {
    patchAllocationReservedCaches(queryClient, items, -1);
  }
}
