/**
 * REQ-0102 — catalog quantity updates vs warehouse allocation rows.
 * Catalog is source of truth; shrink only unreserved warehouse qty on decrease.
 */

import { planAllocationDecrements } from "@/lib/products/plan-allocation-decrements";
import type { AllocationDecrementStep } from "@/lib/products/plan-allocation-decrements";

export type CatalogReconcileAllocationRow = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  /** Carried onto shrink steps for TanStack stock cache patch */
  warehouseId?: string;
};

export type CatalogQuantityReconcileInput = {
  currentCatalog: number;
  newCatalog: number;
  productReserved: number;
  allocations: CatalogReconcileAllocationRow[];
};

export type CatalogQuantityReconcilePlan = {
  ok: boolean;
  blockedReason?: string;
  reservedCommitment: number;
  totalAllocated: number;
  overage: number;
  reducible: number;
  shrinkSteps: AllocationDecrementStep[];
  unitsRemoved: number;
};

/** Sum of product-level + per-warehouse reserved units (disjoint reservation paths). */
export function getReservedCommitment(
  productReserved: number,
  allocations: CatalogReconcileAllocationRow[],
): number {
  const allocationReserved = allocations.reduce(
    (sum, row) => sum + row.reservedQuantity,
    0,
  );
  return productReserved + allocationReserved;
}

/** Pure plan for catalog qty change — client preview + server enforcement. */
export function planCatalogQuantityReconcile(
  input: CatalogQuantityReconcileInput,
): CatalogQuantityReconcilePlan {
  const { currentCatalog, newCatalog, productReserved, allocations } = input;
  const totalAllocated = allocations.reduce(
    (sum, row) => sum + row.quantity,
    0,
  );
  const reservedCommitment = getReservedCommitment(
    productReserved,
    allocations,
  );
  const reducible = allocations.reduce(
    (sum, row) => sum + Math.max(0, row.quantity - row.reservedQuantity),
    0,
  );

  const base: CatalogQuantityReconcilePlan = {
    ok: true,
    reservedCommitment,
    totalAllocated,
    overage: 0,
    reducible,
    shrinkSteps: [],
    unitsRemoved: 0,
  };

  if (newCatalog === currentCatalog) {
    return base;
  }

  if (newCatalog < reservedCommitment) {
    return {
      ...base,
      ok: false,
      blockedReason: `${reservedCommitment} unit(s) are reserved on active orders. Catalog cannot be set below that.`,
    };
  }

  if (newCatalog >= totalAllocated) {
    return base;
  }

  const overage = totalAllocated - newCatalog;
  const shrinkSteps = planAllocationDecrements(allocations, overage);
  const unitsRemoved = shrinkSteps.reduce((sum, step) => sum + step.deduct, 0);

  if (unitsRemoved < overage) {
    return {
      ...base,
      ok: false,
      overage,
      shrinkSteps,
      unitsRemoved,
      blockedReason: `Total allocated (${totalAllocated}) exceeds new catalog (${newCatalog}). Only ${reducible} unreserved unit(s) can be removed from warehouses; reduce warehouse rows manually.`,
    };
  }

  return {
    ...base,
    overage,
    shrinkSteps,
    unitsRemoved,
  };
}
