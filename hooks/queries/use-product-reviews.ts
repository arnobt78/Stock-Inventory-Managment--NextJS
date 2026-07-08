/**
 * Product Review query hooks
 * TanStack Query hooks for product review data fetching and mutations
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
  ProductReview,
  CreateProductReviewInput,
  UpdateProductReviewInput,
} from "@/types";

export function useProductReviews(initialData?: ProductReview[]) {
  return useQuery({
    queryKey: queryKeys.productReviews.lists(),
    queryFn: async () => {
      const response = await apiClient.productReviews.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

export function useProductReview(id: string) {
  return useQuery({
    queryKey: queryKeys.productReviews.detail(id),
    queryFn: async () => {
      const response = await apiClient.productReviews.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useReviewsByProduct(
  productId: string,
  options?: { status?: "approved" | "pending" | "all" },
) {
  const status = options?.status ?? "approved";
  return useQuery({
    queryKey: queryKeys.productReviews.byProduct(productId, status),
    queryFn: async () => {
      const response = await apiClient.productReviews.getByProductId(
        productId,
        status,
      );
      return response.data;
    },
    enabled: !!productId,
  });
}

export function useReviewEligibility(productId: string, orderId?: string) {
  return useQuery({
    queryKey: queryKeys.productReviews.eligibility(productId, orderId),
    queryFn: async () => {
      const response = await apiClient.productReviews.getEligibility(
        productId,
        orderId,
      );
      return response.data;
    },
    enabled: !!productId,
  });
}

export function useCreateProductReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProductReviewInput) => {
      const response = await apiClient.productReviews.create(data);
      return response.data;
    },
    onSuccess: (data: ProductReview) => {
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Review created",
        description: `Review for "${data.productName}" has been created.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Create failed",
        description:
          getErrorMessage(error) || "Failed to create product review.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProductReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductReviewInput;
    }) => {
      const response = await apiClient.productReviews.update(id, data);
      return response.data;
    },
    onSuccess: (data: ProductReview) => {
      queryClient.setQueryData<ProductReview>(
        queryKeys.productReviews.detail(data.id),
        data,
      );
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Review updated",
        description: `Review for "${data.productName}" has been updated.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description:
          getErrorMessage(error) || "Failed to update product review.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProductReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.productReviews.delete(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.productReviews.detail(id),
      );
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Review deleted",
        description: "Product review has been deleted.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description:
          getErrorMessage(error) || "Failed to delete product review.",
        variant: "destructive",
      });
    },
  });
}
