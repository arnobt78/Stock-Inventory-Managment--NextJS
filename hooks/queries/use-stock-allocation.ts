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
  WarehouseStockSummary,
} from "@/types";

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
export function useWarehouseStockSummary() {
  return useQuery({
    queryKey: queryKeys.stockAllocation.summary(),
    queryFn: async () => {
      const response = await apiClient.stockAllocations.getSummary();
      return response.data;
    },
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
