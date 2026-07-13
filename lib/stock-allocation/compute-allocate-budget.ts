/**
 * REQ-0101 — catalog vs warehouse allocation budget for allocate dialog hints.
 * Upsert sets absolute qty per warehouse; max = current row + unallocated catalog.
 */

export type AllocationQtyRow = {
  warehouseId: string;
  quantity: number;
};

export type AllocateBudget = {
  catalogTotal: number;
  totalAllocated: number;
  unallocated: number;
  currentInWarehouse: number;
  /** Max absolute quantity assignable to target warehouse. */
  maxSetQuantity: number;
};

export function computeAllocateBudget(
  catalogQuantity: number,
  allocations: AllocationQtyRow[],
  targetWarehouseId: string,
): AllocateBudget {
  const totalAllocated = allocations.reduce((sum, row) => sum + row.quantity, 0);
  const currentInWarehouse =
    allocations.find((row) => row.warehouseId === targetWarehouseId)?.quantity ??
    0;
  const unallocated = Math.max(0, catalogQuantity - totalAllocated);
  const maxSetQuantity = currentInWarehouse + unallocated;

  return {
    catalogTotal: catalogQuantity,
    totalAllocated,
    unallocated,
    currentInWarehouse,
    maxSetQuantity,
  };
}
