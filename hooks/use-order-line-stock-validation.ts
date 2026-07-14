/**
 * REQ-0111 — reactive order-line stock validation via useStockByProduct.
 * Re-validates when prefetch/cache fills; parent owns cap messages.
 */

import { useMemo } from "react";
import { useStockByProduct } from "@/hooks/queries";
import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import {
  mapStockAllocationsToOrderLineRows,
  resolveOrderLineHasAllocations,
  validateOrderLineStockForItem,
  type OrderLineStockProduct,
  type OrderLineStockValidation,
} from "@/lib/orders/order-line-stock-validation";

export type UseOrderLineStockValidationArgs = {
  productId: string;
  product?: OrderLineStockProduct | null;
  warehouseId?: string;
  quantity?: number;
  enabled?: boolean;
};

export function useOrderLineStockValidation({
  productId,
  product,
  warehouseId,
  quantity,
  enabled = true,
}: UseOrderLineStockValidationArgs): {
  validation: OrderLineStockValidation | null;
  hasAllocations: boolean;
  allocationsLoading: boolean;
  allocationRows: ReturnType<typeof mapStockAllocationsToOrderLineRows>;
} {
  const { data: allocations, isLoading } = useStockByProduct(
    productId,
    undefined,
    { enabled: enabled && !!productId },
  );

  const rows = useMemo(
    () => mapStockAllocationsToOrderLineRows(allocations),
    [allocations],
  );

  const validation = useMemo(() => {
    if (!product || !productId) return null;
    return validateOrderLineStockForItem(
      product,
      { productId, quantity, warehouseId },
      rows,
    );
  }, [product, productId, quantity, warehouseId, rows]);

  const hasAllocations = useMemo(() => {
    if (!product) return false;
    return resolveOrderLineHasAllocations(
      {
        quantity: Number(product.quantity),
        reservedQuantity: product.reservedQuantity,
        committedQuantity: getDisplayCommittedQuantity(product),
      },
      rows,
    );
  }, [product, rows]);

  return {
    validation,
    hasAllocations,
    allocationsLoading: isLoading,
    allocationRows: rows,
  };
}
