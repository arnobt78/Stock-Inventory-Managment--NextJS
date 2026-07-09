/**
 * Supplier query hooks
 * TanStack Query hooks for supplier data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAllRelatedQueries,
  cancelOrRemoveDetailQuery,
  withInitialData,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
} from "@/types";
import type { SupplierForHome } from "@/lib/server/home-data";

/**
 * Fetch all suppliers
 * Query hook for getting the list of all suppliers
 */
export function useSuppliers(initialData?: Supplier[] | SupplierForHome[]) {
  return useQuery<Supplier[]>({
    queryKey: queryKeys.suppliers.lists(),
    queryFn: async () => {
      const response = await apiClient.suppliers.getAll();
      return response.data;
    },
    ...withInitialData(initialData as Supplier[] | undefined),
  });
}

/**
 * Fetch single supplier by ID
 * Query hook for getting a single supplier with all related data
 */
export function useSupplier(supplierId: string, initialData?: Supplier) {
  return useQuery<Supplier>({
    queryKey: queryKeys.suppliers.detail(supplierId),
    queryFn: async () => {
      const response = await apiClient.suppliers.getById(supplierId);
      return response.data;
    },
    // Only fetch if supplierId is provided
    enabled: !!supplierId,
    ...withInitialData(initialData),
  });
}

/**
 * Create supplier mutation
 * Mutation hook for creating a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSupplierInput) => {
      const response = await apiClient.suppliers.create(data);
      return response.data;
    },
    onSuccess: (newSupplier) => {
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Success",
        description: `Supplier "${newSupplier.name}" created successfully`,
      });
      return newSupplier;
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
 * Update supplier mutation
 * Mutation hook for updating an existing supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateSupplierInput) => {
      const response = await apiClient.suppliers.update(data);
      return response.data;
    },
    onSuccess: (updatedSupplier) => {
      invalidateAllRelatedQueries(queryClient);
      if (updatedSupplier.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.suppliers.detail(updatedSupplier.id),
        });
      }
      toast({
        title: "Success",
        description: `Supplier "${updatedSupplier.name}" updated successfully`,
      });
      return updatedSupplier;
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
 * Delete supplier mutation
 * Mutation hook for deleting a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get supplier name before deleting for toast message
      const suppliers = queryClient.getQueryData<Supplier[]>(
        queryKeys.suppliers.lists()
      );
      const supplierToDelete = suppliers?.find((sup) => sup.id === id);
      const supplierName = supplierToDelete?.name || "supplier";

      await apiClient.suppliers.delete(id);
      return { id, name: supplierName };
    },
    onSuccess: (deletedData) => {
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.suppliers.detail(deletedData.id),
      );
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Success",
        description: `Supplier "${deletedData.name}" deleted successfully`,
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

