/**
 * Stock Allocation query hooks
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  invalidateAfterStockChange,
  queryKeys,
  withInitialData,
  patchStockAllocationInCaches,
  removeStockAllocationFromCaches,
  patchStockCachesAfterTransfer,
  patchWarehouseStockSummaryCaches,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  StockAllocation,
  CreateStockAllocationInput,
  CreateStockTransferInput,
  StockTransfer,
  WarehouseStockSummary,
} from "@/types";

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

function findCachedAllocation(
  queryClient: QueryClient,
  allocationId: string,
  scope?: { productId?: string; warehouseId?: string },
): StockAllocation | undefined {
  // REQ-0219 — QueryKey[] so byProduct + byWarehouse tuples both push (Vercel tsc)
  const keys: QueryKey[] = [];
  if (scope?.productId) {
    keys.push(queryKeys.stockAllocation.byProduct(scope.productId));
  }
  if (scope?.warehouseId) {
    keys.push(queryKeys.stockAllocation.byWarehouse(scope.warehouseId));
  }
  for (const key of keys) {
    const rows = queryClient.getQueryData<StockAllocation[]>(key);
    const hit = rows?.find((r) => r.id === allocationId);
    if (hit) return hit;
  }
  return undefined;
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
      const warehouseId = data.warehouseId;
      const prior = warehouseId
        ? queryClient
            .getQueryData<StockAllocation[]>(
              queryKeys.stockAllocation.byWarehouse(warehouseId),
            )
            ?.find((r) => r.id === data.id || r.productId === data.productId)
        : undefined;
      const priorQty = prior ? Number(prior.quantity ?? 0) : 0;
      const nextQty = Number(data.quantity ?? 0);
      const isNewRow = !prior;

      patchStockAllocationInCaches(queryClient, data, {
        byProduct: queryKeys.stockAllocation.byProduct,
        byWarehouse: queryKeys.stockAllocation.byWarehouse,
      });
      // REQ-0218 — list Stock share % from summary
      if (warehouseId) {
        patchWarehouseStockSummaryCaches(
          queryClient,
          queryKeys.stockAllocation.summary(),
          [
            {
              warehouseId,
              quantityDelta: nextQty - priorQty,
              productsDelta: isNewRow ? 1 : 0,
            },
          ],
        );
      }
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
      const prior = findCachedAllocation(queryClient, data.id, {
        productId: data.productId,
        warehouseId: data.warehouseId,
      });
      const priorQty = Number(prior?.quantity ?? 0);
      const nextQty = Number(data.quantity ?? 0);

      patchStockAllocationInCaches(queryClient, data, {
        byProduct: queryKeys.stockAllocation.byProduct,
        byWarehouse: queryKeys.stockAllocation.byWarehouse,
      });
      if (data.warehouseId) {
        patchWarehouseStockSummaryCaches(
          queryClient,
          queryKeys.stockAllocation.summary(),
          [
            {
              warehouseId: data.warehouseId,
              quantityDelta: nextQty - priorQty,
            },
          ],
        );
      }
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

export type DeleteStockAllocationInput = {
  id: string;
  productId: string;
  warehouseId: string;
};

/**
 * Delete stock allocation row from a warehouse
 */
export function useDeleteStockAllocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: DeleteStockAllocationInput) => {
      await apiClient.stockAllocations.delete(input.id);
      return input;
    },
    onSuccess: (input) => {
      const prior = findCachedAllocation(queryClient, input.id, {
        productId: input.productId,
        warehouseId: input.warehouseId,
      });
      const priorQty = Number(prior?.quantity ?? 0);

      removeStockAllocationFromCaches(
        queryClient,
        input.id,
        {
          byProduct: queryKeys.stockAllocation.byProduct,
          byWarehouse: queryKeys.stockAllocation.byWarehouse,
        },
        { productId: input.productId, warehouseId: input.warehouseId },
      );
      patchWarehouseStockSummaryCaches(
        queryClient,
        queryKeys.stockAllocation.summary(),
        [
          {
            warehouseId: input.warehouseId,
            quantityDelta: -priorQty,
            productsDelta: -1,
          },
        ],
      );
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
      // REQ-0218 — patch both warehouse/product allocation sides + summary share %
      const destHadProduct = queryClient
        .getQueryData<StockAllocation[]>(
          queryKeys.stockAllocation.byWarehouse(data.toWarehouseId),
        )
        ?.some((r) => r.productId === data.productId);
      const sourceRow = queryClient
        .getQueryData<StockAllocation[]>(
          queryKeys.stockAllocation.byWarehouse(data.fromWarehouseId),
        )
        ?.find((r) => r.productId === data.productId);
      const sourceWillEmpty =
        sourceRow != null &&
        Number(sourceRow.quantity ?? 0) - Number(data.quantity ?? 0) <= 0 &&
        Number(sourceRow.reservedQuantity ?? 0) <= 0;

      patchStockCachesAfterTransfer(
        queryClient,
        {
          productId: data.productId,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          quantity: data.quantity,
        },
        {
          byProduct: queryKeys.stockAllocation.byProduct,
          byWarehouse: queryKeys.stockAllocation.byWarehouse,
        },
      );
      patchWarehouseStockSummaryCaches(
        queryClient,
        queryKeys.stockAllocation.summary(),
        [
          {
            warehouseId: data.fromWarehouseId,
            quantityDelta: -Number(data.quantity ?? 0),
            productsDelta: sourceWillEmpty ? -1 : 0,
          },
          {
            warehouseId: data.toWarehouseId,
            quantityDelta: Number(data.quantity ?? 0),
            productsDelta: destHadProduct ? 0 : 1,
          },
        ],
      );
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
