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

/** Validate absolute allocation qty against reserved floor and catalog budget. */
export function validateAllocationUpsert(
  input: ValidateAllocationUpsertInput,
): AllocationValidationResult {
  const {
    catalogQty,
    allocations,
    targetWarehouseId,
    newAbsoluteQty,
    rowReserved,
  } = input;

  if (newAbsoluteQty < rowReserved) {
    return {
      ok: false,
      error: `Quantity cannot be below ${rowReserved} reserved unit(s) for this warehouse.`,
    };
  }

  const budget = computeAllocateBudget(
    catalogQty,
    allocations,
    targetWarehouseId,
  );

  if (newAbsoluteQty > budget.maxSetQuantity) {
    return {
      ok: false,
      error: `Quantity exceeds catalog budget. Maximum assignable: ${budget.maxSetQuantity} (${budget.unallocated} unallocated + ${budget.currentInWarehouse} in this warehouse).`,
    };
  }

  return { ok: true };
}
