/**
 * Product Review query hooks
 * TanStack Query hooks for product review data fetching and mutations
 *
 * REQ-0165 — patch eligibility (order-scoped) before invalidate so Write review
 * never flashes beside stars after create/delete.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAllRelatedQueries,
  cancelOrRemoveDetailQuery,
  withInitialData,
  patchDetailCache,
  patchListCaches,
  removeFromListCaches,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  ProductReview,
  CreateProductReviewInput,
  UpdateProductReviewInput,
} from "@/types";

/** Find a review in detail or list caches (before remove). */
function findCachedProductReview(
  queryClient: QueryClient,
  id: string,
): ProductReview | undefined {
  const detail = queryClient.getQueryData<ProductReview>(
    queryKeys.productReviews.detail(id),
  );
  if (detail?.id === id) return detail;

  const queries = queryClient.getQueriesData<unknown>({
    queryKey: queryKeys.productReviews.all,
  });
  for (const [, data] of queries) {
    if (Array.isArray(data)) {
      const hit = (data as ProductReview[]).find((r) => r.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Instant eligibility patch for order-scoped Write button (then invalidate). */
function patchReviewEligibilityAfterCreate(
  queryClient: QueryClient,
  data: ProductReview,
): void {
  const orderId = data.orderId ?? undefined;
  queryClient.setQueryData(
    queryKeys.productReviews.eligibility(data.productId, orderId),
    { eligible: false, slots: [] },
  );
}

function patchReviewEligibilityAfterDelete(
  queryClient: QueryClient,
  review: ProductReview,
): void {
  if (!review.productId || !review.orderId) return;
  queryClient.setQueryData(
    queryKeys.productReviews.eligibility(review.productId, review.orderId),
    {
      eligible: true,
      slots: [
        {
          orderId: review.orderId,
          orderItemId: review.orderItemId ?? undefined,
        },
      ],
    },
  );
}

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

export function useProductReview(id: string, initialData?: ProductReview) {
  return useQuery({
    queryKey: queryKeys.productReviews.detail(id),
    queryFn: async () => {
      const response = await apiClient.productReviews.getById(id);
      return response.data;
    },
    enabled: !!id,
    ...withInitialData(initialData),
  });
}

export function useReviewsByProduct(
  productId: string,
  options?: {
    status?: "approved" | "pending" | "all";
    enabled?: boolean;
    initialData?: ProductReview[];
  },
) {
  const status = options?.status ?? "approved";
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: queryKeys.productReviews.byProduct(productId, status),
    queryFn: async () => {
      const response = await apiClient.productReviews.getByProductId(
        productId,
        status,
      );
      return response.data;
    },
    enabled: !!productId && enabled,
    ...withInitialData(options?.initialData),
  });
}

export function useReviewEligibility(
  productId: string,
  orderId?: string,
  options?: {
    enabled?: boolean;
    initialData?: { eligible: boolean; slots: { orderId: string; orderItemId?: string }[] };
  },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: queryKeys.productReviews.eligibility(productId, orderId),
    queryFn: async () => {
      const response = await apiClient.productReviews.getEligibility(
        productId,
        orderId,
      );
      return response.data;
    },
    enabled: !!productId && enabled,
    ...withInitialData(options?.initialData),
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
      patchDetailCache(
        queryClient,
        queryKeys.productReviews.detail(data.id),
        data,
      );
      patchListCaches(queryClient, queryKeys.productReviews.all, data, {
        prependIfMissing: true,
      });
      // REQ-0165 — hide Write immediately (before eligibility refetch)
      patchReviewEligibilityAfterCreate(queryClient, data);
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
      patchDetailCache(
        queryClient,
        queryKeys.productReviews.detail(data.id),
        data,
      );
      patchListCaches(queryClient, queryKeys.productReviews.all, data);
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
      // REQ-0165 — restore eligibility before list remove so Write appears without lag flash
      const cached = findCachedProductReview(queryClient, id);
      if (cached) patchReviewEligibilityAfterDelete(queryClient, cached);
      removeFromListCaches(queryClient, queryKeys.productReviews.all, id);
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
