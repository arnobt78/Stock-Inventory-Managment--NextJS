/**
 * REQ-0108 — live catalog quantity reconcile preview for ProductFormDialog.
 */
import { useMemo } from "react";
import { planCatalogQuantityReconcile } from "@/lib/stock-allocation/catalog-quantity-reconcile";
import type { StockAllocation } from "@/types";

export type CatalogReconcilePreviewInput = {
  selectedProduct: { quantity: number; reservedQuantity?: number | null } | null;
  allocations: Pick<
    StockAllocation,
    "id" | "quantity" | "reservedQuantity"
  >[];
  quantityRaw: number | string | undefined;
};

export type CatalogReconcilePreview = {
  ok: boolean;
  blockedReason: string | null;
  shrinkUnits: number;
  reservedCommitment: number;
  catalogPreviewQty: number;
  allocatedTotal: number;
  unallocatedPreview: number;
};

export function computeCatalogReconcilePreview(
  input: CatalogReconcilePreviewInput,
): CatalogReconcilePreview {
  const { selectedProduct, allocations, quantityRaw } = input;

  const allocatedTotal = allocations.reduce(
    (sum, row) => sum + Number(row.quantity),
    0,
  );

  if (!selectedProduct) {
    return {
      ok: true,
      blockedReason: null,
      shrinkUnits: 0,
      reservedCommitment: 0,
      catalogPreviewQty: 0,
      allocatedTotal,
      unallocatedPreview: 0,
    };
  }

  const parsed =
    typeof quantityRaw === "string" && quantityRaw === ""
      ? 0
      : Number(quantityRaw);
  const catalogPreviewQty = Number.isFinite(parsed)
    ? parsed
    : selectedProduct.quantity;
  const unallocatedPreview = Math.max(0, catalogPreviewQty - allocatedTotal);

  const plan = planCatalogQuantityReconcile({
    currentCatalog: selectedProduct.quantity,
    newCatalog: catalogPreviewQty,
    productReserved: selectedProduct.reservedQuantity ?? 0,
    allocations: allocations.map((row) => ({
      id: row.id,
      quantity: Number(row.quantity),
      reservedQuantity: Number(row.reservedQuantity ?? 0),
    })),
  });

  return {
    ok: plan.ok,
    blockedReason: plan.blockedReason ?? null,
    shrinkUnits: plan.unitsRemoved,
    reservedCommitment: plan.reservedCommitment,
    catalogPreviewQty,
    allocatedTotal,
    unallocatedPreview,
  };
}

export function useCatalogQuantityReconcilePreview(
  input: CatalogReconcilePreviewInput,
): CatalogReconcilePreview {
  const { selectedProduct, allocations, quantityRaw } = input;
  return useMemo(
    () =>
      computeCatalogReconcilePreview({
        selectedProduct,
        allocations,
        quantityRaw,
      }),
    [selectedProduct, allocations, quantityRaw],
  );
}
