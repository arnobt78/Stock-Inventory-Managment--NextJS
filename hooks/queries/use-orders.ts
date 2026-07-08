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
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Order, CreateOrderInput, UpdateOrderInput } from "@/types";
import type { OrderForPage } from "@/lib/server/orders-data";

/**
 * Fetch all orders
 * Query hook for getting the list of all orders
 */
export function useOrders(initialData?: Order[] | OrderForPage[]) {
  return useQuery<Order[]>({
    queryKey: queryKeys.orders.lists(),
    queryFn: async () => {
      const response = await apiClient.orders.getAll();
      return response.data;
    },
    ...withInitialData(initialData as Order[] | undefined),
  });
}

/**
 * Fetch client orders (orders that contain products owned by the current user).
 * Used on admin "Client Orders" page. Detail uses same useOrder(id) — GET /api/orders/:id allows product owner.
 */
export function useClientOrders(initialData?: Order[]) {
  return useQuery({
    queryKey: queryKeys.clientOrders.lists(),
    queryFn: async () => {
      const response = await apiClient.admin.getClientOrders();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/**
 * Fetch order by ID
 * Query hook for getting a single order
 *
 * @param orderId - Order ID
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const response = await apiClient.orders.getById(orderId);
      return response.data;
    },
    enabled: !!orderId, // Only fetch if orderId is provided
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
      queryClient.setQueryData<Order>(queryKeys.orders.detail(data.id), data);
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
