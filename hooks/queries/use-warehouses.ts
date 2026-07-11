/**
 * Warehouse query hooks
 * TanStack Query hooks for warehouse data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAllRelatedQueries,
  invalidateAfterStockChange,
  cancelOrRemoveDetailQuery,
  withInitialData,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "@/types";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";

/**
 * Fetch all warehouses
 */
export function useWarehouses(initialData?: Warehouse[] | WarehouseForPage[]) {
  return useQuery<Warehouse[]>({
    queryKey: queryKeys.warehouses.lists(),
    queryFn: async () => {
      const response = await apiClient.warehouses.getAll();
      return response.data;
    },
    ...withInitialData(initialData as Warehouse[] | undefined),
  });
}

/**
 * Fetch single warehouse by ID
 */
export function useWarehouse(warehouseId: string, initialData?: Warehouse) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(warehouseId),
    queryFn: async () => {
      const response = await apiClient.warehouses.getById(warehouseId);
      return response.data;
    },
    enabled: !!warehouseId,
    ...withInitialData(initialData),
  });
}

/**
 * Create warehouse mutation
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateWarehouseInput) => {
      const response = await apiClient.warehouses.create(data);
      return response.data;
    },
    onSuccess: (newWarehouse) => {
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Success",
        description: `Warehouse "${newWarehouse.name}" created successfully`,
      });
      return newWarehouse;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

/**
 * Update warehouse mutation
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateWarehouseInput) => {
      const response = await apiClient.warehouses.update(data);
      return response.data;
    },
    onSuccess: (updatedWarehouse) => {
      invalidateAllRelatedQueries(queryClient);
      if (updatedWarehouse.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.warehouses.detail(updatedWarehouse.id),
        });
      }
      toast({
        title: "Success",
        description: `Warehouse "${updatedWarehouse.name}" updated successfully`,
      });
      return updatedWarehouse;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete warehouse mutation
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const warehouses = queryClient.getQueryData<Warehouse[]>(
        queryKeys.warehouses.lists(),
      );
      const warehouseToDelete = warehouses?.find((w) => w.id === id);
      const warehouseName = warehouseToDelete?.name || "warehouse";

      await apiClient.warehouses.delete(id);
      return { id, name: warehouseName };
    },
    onSuccess: (deletedData) => {
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.warehouses.detail(deletedData.id),
      );
      invalidateAllRelatedQueries(queryClient);
      invalidateAfterStockChange(queryClient);
      toast({
        title: "Success",
        description: `Warehouse "${deletedData.name}" deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}
