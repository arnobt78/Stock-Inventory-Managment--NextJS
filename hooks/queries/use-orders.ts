/**
 * Order query hooks
 * TanStack Query hooks for order data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAfterOrderGraphChange,
  cancelOrRemoveDetailQuery,
  withInitialData,
  patchDetailCacheMerge,
  patchListCaches,
  patchOrderGraphListCaches,
  patchInvoicesOnOrderCancel,
  patchLinkedInvoicesFromOrder,
  patchProductCommittedCaches,
  resolveOrderCommittedDeltas,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import { resolveOrderStatusAtFromSource } from "@/lib/orders/order-status-display-date";
import {
  mergeOrderItemsPreservingDensify,
  omitUndefinedFields,
} from "@/lib/orders/merge-order-items-densify";
import type { Order, CreateOrderInput, UpdateOrderInput } from "@/types";
import type { OrderForPage } from "@/lib/server/orders-data";

/**
 * Fetch all orders
 * Query hook for getting the list of all orders
 */
export function useOrders(
  initialData?: Order[] | OrderForPage[],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  return useQuery<Order[]>({
    queryKey: queryKeys.orders.lists(),
    queryFn: async () => {
      const response = await apiClient.orders.getAll();
      return response.data;
    },
    enabled,
    ...withInitialData(initialData as Order[] | undefined),
  });
}

/**
 * Fetch client orders (orders that contain products owned by the current user).
 * Used on admin "Client Orders" page. Detail uses same useOrder(id) — GET /api/orders/:id allows product owner.
 */
export function useClientOrders(
  initialData?: Order[],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: queryKeys.clientOrders.lists(),
    queryFn: async () => {
      const response = await apiClient.admin.getClientOrders();
      return response.data;
    },
    enabled,
    ...withInitialData(initialData),
  });
}

/**
 * Fetch order by ID
 * Query hook for getting a single order
 *
 * @param orderId - Order ID
 */
export function useOrder(orderId: string, initialData?: Order) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const response = await apiClient.orders.getById(orderId);
      return response.data;
    },
    enabled: !!orderId, // Only fetch if orderId is provided
    ...withInitialData(initialData),
  });
}

/**
 * Create order mutation
 * Mutation hook for creating a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await apiClient.orders.create(data);
      return response.data;
    },
    onSuccess: (data: Order) => {
      // REQ-0221 — densified 201; merge detail + list (incl. productOwner* for client Store ·)
      patchDetailCacheMerge<Order>(
        queryClient,
        queryKeys.orders.detail(data.id),
        (old) => (old ? { ...old, ...data } : data),
      );
      patchListCaches(queryClient, queryKeys.orders.all, data, {
        prependIfMissing: true,
      });
      patchListCaches(queryClient, queryKeys.clientOrders.all, data, {
        prependIfMissing: true,
      });
      // Pending create reserves stock — bump committedQuantity before invalidate
      patchProductCommittedCaches(
        queryClient,
        resolveOrderCommittedDeltas(null, data),
      );
      invalidateAfterOrderGraphChange(queryClient);

      // Show success toast
      toast({
        title: "Order Created Successfully",
        description: `Order ${data.orderNumber} has been created.`,
      });
    },
    onError: (error: unknown) => {
      // Show error toast
      toast({
        title: "Order Creation Failed",
        description:
          getErrorMessage(error) || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Update order mutation
 * Mutation hook for updating an existing order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOrderInput;
    }) => {
      const response = await apiClient.orders.update(id, data);
      return response.data;
    },
    onSuccess: (data: Order) => {
      // PUT body is thin (no parties densify) — merge, don't replace detail.
      // Also sync invoice linkedOrderStatus/Payment (patchOrderGraph matches invoice by id≠order.id).
      // REQ-0136 — always resolve statusAt (updatedAt fallback) so list Status date
      // updates on confirm/process and does not keep a stale shipped/delivered stamp.
      const prevCached =
        queryClient.getQueryData<Order>(queryKeys.orders.detail(data.id)) ??
        queryClient.getQueryData<Order>(
          queryKeys.clientOrders.detail(data.id),
        );
      const updatedAtIso =
        data.updatedAt == null
          ? undefined
          : typeof data.updatedAt === "string"
            ? data.updatedAt
            : new Date(data.updatedAt).toISOString();
      const statusAt =
        resolveOrderStatusAtFromSource(data) ?? updatedAtIso ?? undefined;
      // Thin PUT items lack category/supplier names — merge densify; omit undefined
      // except statusAt which must always overwrite prior terminal dates when set.
      const statusPatch = {
        ...omitUndefinedFields({
          id: data.id,
          status: data.status,
          paymentStatus: data.paymentStatus,
          shippedAt:
            data.shippedAt == null
              ? undefined
              : typeof data.shippedAt === "string"
                ? data.shippedAt
                : new Date(data.shippedAt).toISOString(),
          deliveredAt:
            data.deliveredAt == null
              ? undefined
              : typeof data.deliveredAt === "string"
                ? data.deliveredAt
                : new Date(data.deliveredAt).toISOString(),
          cancelledAt:
            data.cancelledAt == null
              ? undefined
              : typeof data.cancelledAt === "string"
                ? data.cancelledAt
                : new Date(data.cancelledAt).toISOString(),
          trackingNumber: data.trackingNumber,
          trackingCarrier: data.trackingCarrier,
          trackingUrl: data.trackingUrl,
          labelUrl: data.labelUrl,
          updatedAt: updatedAtIso ?? statusAt,
          notes: data.notes,
          estimatedDelivery:
            data.estimatedDelivery == null
              ? undefined
              : typeof data.estimatedDelivery === "string"
                ? data.estimatedDelivery
                : new Date(data.estimatedDelivery).toISOString(),
          subtotal: data.subtotal,
          tax: data.tax,
          shipping: data.shipping,
          discount: data.discount,
          total: data.total,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
        } as Record<string, unknown>),
        ...(statusAt != null ? { statusAt } : {}),
      } as Partial<Order> & { id: string };
      patchDetailCacheMerge<Order>(
        queryClient,
        queryKeys.orders.detail(data.id),
        (old) => {
          if (!old) {
            return { ...data, ...statusPatch } as Order;
          }
          return {
            ...old,
            ...statusPatch,
            // Keep invoice chip + parties; merge line densify (no category flash)
            items: mergeOrderItemsPreservingDensify(old.items, data.items),
            invoiceForOrder: old.invoiceForOrder ?? data.invoiceForOrder,
          };
        },
      );
      patchDetailCacheMerge<Order>(
        queryClient,
        queryKeys.clientOrders.detail(data.id),
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            ...statusPatch,
            items: mergeOrderItemsPreservingDensify(old.items, data.items),
            invoiceForOrder: old.invoiceForOrder ?? data.invoiceForOrder,
          };
        },
      );
      // Lists do not render line items — never push thin items into list rows
      patchListCaches(queryClient, queryKeys.orders.all, statusPatch);
      patchListCaches(queryClient, queryKeys.clientOrders.all, statusPatch);
      patchLinkedInvoicesFromOrder(queryClient, {
        orderId: data.id,
        status: data.status,
        paymentStatus: data.paymentStatus,
        statusAt,
        // Cache/API dates are ISO strings; Order type still allows Date
        updatedAt:
          statusPatch.updatedAt == null
            ? null
            : typeof statusPatch.updatedAt === "string"
              ? statusPatch.updatedAt
              : new Date(statusPatch.updatedAt).toISOString(),
      });
      // REQ-0221 — fulfill/release reserved densify on status/payment transition
      patchProductCommittedCaches(
        queryClient,
        resolveOrderCommittedDeltas(prevCached, {
          status: data.status,
          paymentStatus: data.paymentStatus,
          items: (prevCached?.items ?? data.items)?.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      );
      invalidateAfterOrderGraphChange(queryClient);

      // Show success toast
      toast({
        title: "Order Updated Successfully",
        description: `Order ${data.orderNumber} has been updated.`,
      });
    },
    onError: (error: unknown) => {
      // Show error toast
      toast({
        title: "Order Update Failed",
        description:
          getErrorMessage(error) || "Failed to update order. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete/Cancel order mutation
 * Mutation hook for cancelling an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.orders.delete(id);
      return response.data;
    },
    onSuccess: (data: Order) => {
      // REQ-0210 — statusAt for list Status column; patch linked invoices (not order.id)
      const prevCached =
        queryClient.getQueryData<Order>(queryKeys.orders.detail(data.id)) ??
        queryClient.getQueryData<Order>(
          queryKeys.clientOrders.detail(data.id),
        );
      const cancelledAtIso =
        data.cancelledAt == null
          ? new Date().toISOString()
          : typeof data.cancelledAt === "string"
            ? data.cancelledAt
            : new Date(data.cancelledAt).toISOString();
      // Thin DELETE body — merge into existing detail (keep parties densify).
      // Full replace wiped placedBy/customer/owners → Parties showed "—" for a beat.
      const cancelPatch = {
        id: data.id,
        status: data.status,
        paymentStatus: data.paymentStatus,
        statusAt: cancelledAtIso,
        cancelledAt: cancelledAtIso,
        updatedAt:
          data.updatedAt == null
            ? cancelledAtIso
            : typeof data.updatedAt === "string"
              ? data.updatedAt
              : new Date(data.updatedAt).toISOString(),
        invoiceForOrder: data.invoiceForOrder ?? undefined,
      };
      patchDetailCacheMerge<Order>(
        queryClient,
        queryKeys.orders.detail(data.id),
        // ISO cancelledAt/updatedAt match list/detail ClientDate* (Order allows Date|string at runtime)
        (old) =>
          (old
            ? { ...old, ...cancelPatch }
            : { ...data, ...cancelPatch }) as Order,
      );
      patchDetailCacheMerge<Order>(
        queryClient,
        queryKeys.clientOrders.detail(data.id),
        (old) =>
          old ? ({ ...old, ...cancelPatch } as Order) : undefined,
      );
      patchOrderGraphListCaches(queryClient, cancelPatch);
      patchInvoicesOnOrderCancel(queryClient, {
        ...cancelPatch,
        invoiceForOrder: data.invoiceForOrder ?? null,
      });
      // REQ-0221 — release pending reservation densify
      patchProductCommittedCaches(
        queryClient,
        resolveOrderCommittedDeltas(prevCached, {
          status: data.status,
          paymentStatus: data.paymentStatus,
          items: (prevCached?.items ?? data.items)?.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      );
      cancelOrRemoveDetailQuery(queryClient, queryKeys.orders.detail(data.id));
      invalidateAfterOrderGraphChange(queryClient);

      // Show success toast
      toast({
        title: "Order Cancelled Successfully",
        description: `Order ${data.orderNumber} has been cancelled.`,
      });
    },
    onError: (error: unknown) => {
      // Show error toast
      toast({
        title: "Order Cancellation Failed",
        description:
          getErrorMessage(error) || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    },
  });
}
