/**
 * REQ-0102 — server validation for allocation upsert (POST + PUT).
 * Absolute qty per warehouse; capped by unallocated catalog budget.
 */

import { computeAllocateBudget } from "@/lib/stock-allocation/compute-allocate-budget";

export type AllocationUpsertRow = {
  warehouseId: string;
  quantity: number;
};

export type ValidateAllocationUpsertInput = {
  catalogQty: number;
  allocations: AllocationUpsertRow[];
  targetWarehouseId: string;
  newAbsoluteQty: number;
  rowReserved: number;
};

export type AllocationValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export type AllocationQtyBounds = {
  minQty: number;
  maxQty: number;
  unallocated: number;
  currentInWarehouse: number;
};

/** REQ-0110 — shared min/max for allocate dialog + server validation. */
export function getAllocationQtyBounds(
  input: ValidateAllocationUpsertInput,
): AllocationQtyBounds {
  const budget = computeAllocateBudget(
    input.catalogQty,
    input.allocations,
    input.targetWarehouseId,
  );

  return {
    minQty: input.rowReserved,
    maxQty: budget.maxSetQuantity,
    unallocated: budget.unallocated,
    currentInWarehouse: budget.currentInWarehouse,
  };
}

/** Validate absolute allocation qty against reserved floor and catalog budget. */
export function validateAllocationUpsert(
  input: ValidateAllocationUpsertInput,
): AllocationValidationResult {
  const { newAbsoluteQty, rowReserved } = input;
  const { maxQty, unallocated, currentInWarehouse } =
    getAllocationQtyBounds(input);

  if (newAbsoluteQty < rowReserved) {
    return {
      ok: false,
      error: `Quantity cannot be below ${rowReserved} reserved unit(s) for this warehouse.`,
    };
  }

  if (newAbsoluteQty > maxQty) {
    return {
      ok: false,
      error: `Quantity exceeds catalog budget. Maximum assignable: ${maxQty} (${unallocated} unallocated + ${currentInWarehouse} in this warehouse).`,
    };
  }

  return { ok: true };
}
