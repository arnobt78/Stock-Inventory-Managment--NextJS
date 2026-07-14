/**
 * Stock Allocation query hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import { invalidateAfterStockChange, queryKeys, withInitialData } from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  StockAllocation,
  CreateStockAllocationInput,
  CreateStockTransferInput,
  StockTransfer,
  WarehouseStockSummary,
} from "@/types";
import type { QueryClient } from "@tanstack/react-query";

/** Shared queryFn for useStockByProduct + prefetch (REQ-0110). */
export async function fetchStockByProduct(
  productId: string,
): Promise<StockAllocation[]> {
  const response = await apiClient.stockAllocations.getByProduct(productId);
  return response.data;
}

/** Warm allocation cache before order-line validation (read-only). */
export function prefetchStockByProduct(
  queryClient: QueryClient,
  productId: string,
): Promise<void> {
  if (!productId) return Promise.resolve();
  return queryClient.prefetchQuery({
    queryKey: queryKeys.stockAllocation.byProduct(productId),
    queryFn: () => fetchStockByProduct(productId),
  });
}

/**
 * Get all stock allocations
 */
export function useStockAllocations() {
  return useQuery({
    queryKey: queryKeys.stockAllocation.lists(),
    queryFn: async () => {
      const response = await apiClient.stockAllocations.getAll();
      return response.data;
    },
  });
}

/**
 * Get warehouse stock summary
 */
export function useWarehouseStockSummary(
  initialData?: WarehouseStockSummary[],
) {
  return useQuery({
    queryKey: queryKeys.stockAllocation.summary(),
    queryFn: async () => {
      const response = await apiClient.stockAllocations.getSummary();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/**
 * Get stock allocations for a specific product
 */
export function useStockByProduct(
  productId: string,
  initialData?: StockAllocation[],
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.stockAllocation.byProduct(productId),
    queryFn: () => fetchStockByProduct(productId),
    enabled: (options?.enabled ?? true) && !!productId,
    ...withInitialData(initialData),
  });
}

/**
 * Get stock allocations for a specific warehouse
 */
export function useStockByWarehouse(
  warehouseId: string,
  initialData?: StockAllocation[],
) {
  return useQuery({
    queryKey: queryKeys.stockAllocation.byWarehouse(warehouseId),
    queryFn: async () => {
      const response =
        await apiClient.stockAllocations.getByWarehouse(warehouseId);
      return response.data;
    },
    enabled: !!warehouseId,
    ...withInitialData(initialData),
  });
}

/**
 * Create or update stock allocation
 */
export function useCreateStockAllocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateStockAllocationInput) => {
      const response = await apiClient.stockAllocations.create(data);
      return response.data;
    },
    onSuccess: (data: StockAllocation) => {
      invalidateAfterStockChange(queryClient);
      toast({
        title: "Stock allocation saved",
        description: `Stock allocated to ${data.warehouse?.name ?? "warehouse"}.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Allocation failed",
        description:
          getErrorMessage(error) || "Failed to save stock allocation.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Update stock allocation quantity by row id (REQ-0102 — edit warehouse row).
 */
export function useUpdateStockAllocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; quantity: number }) => {
      const response = await apiClient.stockAllocations.update(input.id, {
        quantity: input.quantity,
      });
      return response.data;
    },
    onSuccess: (data: StockAllocation) => {
      invalidateAfterStockChange(queryClient);
      toast({
        title: "Allocation updated",
        description: `Stock updated in ${data.warehouse?.name ?? "warehouse"}.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description:
          getErrorMessage(error) || "Failed to update stock allocation.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete stock allocation row from a warehouse
 */
export function useDeleteStockAllocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.stockAllocations.delete(id);
      return response.data;
    },
    onSuccess: () => {
      invalidateAfterStockChange(queryClient);
      toast({
        title: "Allocation removed",
        description: "Product stock was removed from this warehouse.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Remove failed",
        description:
          getErrorMessage(error) || "Failed to remove stock allocation.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Create and complete a stock transfer between warehouses
 */
export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateStockTransferInput) => {
      const response = await apiClient.stockTransfers.create(data);
      return response.data;
    },
    onSuccess: (data: StockTransfer) => {
      invalidateAfterStockChange(queryClient);
      toast({
        title: "Stock transferred",
        description: `Moved ${data.quantity} unit(s) to ${data.toWarehouse?.name ?? "destination warehouse"}.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Transfer failed",
        description:
          getErrorMessage(error) || "Failed to transfer stock between warehouses.",
        variant: "destructive",
      });
    },
  });
}
