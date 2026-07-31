/**
 * Category query hooks
 * TanStack Query hooks for category data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAfterCatalogChange,
  cancelOrRemoveDetailQuery,
  withInitialData,
  patchDetailCacheMerge,
  patchListCaches,
  removeFromListCaches,
} from "@/lib/react-query";
import { mergeCatalogMutationIntoDetail } from "@/lib/catalog/merge-catalog-mutation-densify";
import { useToast } from "@/hooks/use-toast";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types";
import type { CategoryForHome } from "@/lib/server/home-data";

/**
 * Fetch all categories
 * Query hook for getting the list of all categories
 */
export function useCategories(
  initialData?: Category[] | CategoryForHome[],
  options?: { enabled?: boolean },
) {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories.lists(),
    queryFn: async () => {
      const response = await apiClient.categories.getAll();
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...withInitialData(initialData as Category[] | undefined),
  });
}

/**
 * Fetch single category by ID
 * Query hook for getting a single category with all related data
 */
export function useCategory(categoryId: string, initialData?: Category) {
  return useQuery<Category>({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: async () => {
      const response = await apiClient.categories.getById(categoryId);
      return response.data;
    },
    // Only fetch if categoryId is provided
    enabled: !!categoryId,
    ...withInitialData(initialData),
  });
}

/**
 * Create category mutation
 * Mutation hook for creating a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await apiClient.categories.create(data);
      return response.data;
    },
    onSuccess: (newCategory) => {
      if (newCategory.id) {
        // REQ-0218 — merge so thin create never wipes densify if detail was warmed
        patchDetailCacheMerge<Category>(
          queryClient,
          queryKeys.categories.detail(newCategory.id),
          (old) => mergeCatalogMutationIntoDetail(old, newCategory),
        );
        patchListCaches(queryClient, queryKeys.categories.all, newCategory, {
          prependIfMissing: true,
        });
      }
      invalidateAfterCatalogChange(queryClient);
      toast({
        title: "Success",
        description: `Category "${newCategory.name}" created successfully`,
      });
      return newCategory;
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
 * Update category mutation
 * Mutation hook for updating an existing category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateCategoryInput) => {
      const response = await apiClient.categories.update(data);
      return response.data;
    },
    onSuccess: (updatedCategory) => {
      if (updatedCategory.id) {
        // REQ-0218 — thin PUT must not wipe categoryInsights / products / statistics
        patchDetailCacheMerge<Category>(
          queryClient,
          queryKeys.categories.detail(updatedCategory.id),
          (old) => mergeCatalogMutationIntoDetail(old, updatedCategory),
        );
        patchListCaches(queryClient, queryKeys.categories.all, updatedCategory);
      }
      invalidateAfterCatalogChange(queryClient);
      toast({
        title: "Success",
        description: `Category "${updatedCategory.name}" updated successfully`,
      });
      return updatedCategory;
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
 * Delete category mutation
 * Mutation hook for deleting a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get category name before deleting for toast message
      const categories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.lists()
      );
      const categoryToDelete = categories?.find((cat) => cat.id === id);
      const categoryName = categoryToDelete?.name || "category";

      await apiClient.categories.delete(id);
      return { id, name: categoryName };
    },
    onSuccess: (deletedData) => {
      removeFromListCaches(queryClient, queryKeys.categories.all, deletedData.id);
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.categories.detail(deletedData.id),
      );
      invalidateAfterCatalogChange(queryClient);
      toast({
        title: "Success",
        description: `Category "${deletedData.name}" deleted successfully`,
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

