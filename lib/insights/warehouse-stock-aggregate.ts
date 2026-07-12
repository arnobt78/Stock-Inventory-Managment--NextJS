/**
 * REQ-0085 — aggregate available/reserved units from stock allocation rows.
 * Used by product insights enrich (SSR + client) and warehouse insights compute.
 */

import type { StockAllocation } from "@/types";

export type WarehouseStockTotals = {
  available: number;
  reserved: number;
  /** Catalog qty not assigned to any warehouse row */
  unallocated?: number;
};

/** Sum allocated quantity across warehouse rows (ignores reserved split). */
export function sumAllocatedQuantity(allocations: StockAllocation[]): number {
  return allocations.reduce(
    (sum, row) => sum + Number(row.quantity ?? 0),
    0,
  );
}

/** Sum available (qty − reserved) and reserved across allocation rows; undefined when empty. */
export function aggregateWarehouseStockFromAllocations(
  allocations: StockAllocation[],
): { available: number; reserved: number } | undefined {
  if (allocations.length === 0) return undefined;

  let available = 0;
  let reserved = 0;
  for (const row of allocations) {
    const reservedQty = Number(row.reservedQuantity ?? 0);
    const total = Number(row.quantity ?? 0);
    reserved += reservedQty;
    available += Math.max(0, total - reservedQty);
  }
  return { available, reserved };
}

/** Warehouse breakdown plus optional unallocated slice when catalog qty is known. */
export function aggregateWarehouseStockWithUnallocated(
  allocations: StockAllocation[],
  catalogQuantity?: number,
): WarehouseStockTotals | undefined {
  const base = aggregateWarehouseStockFromAllocations(allocations);
  if (!base) return undefined;

  if (catalogQuantity == null || Number.isNaN(catalogQuantity)) {
    return base;
  }

  const allocatedTotal = sumAllocatedQuantity(allocations);
  const unallocated = Math.max(0, catalogQuantity - allocatedTotal);
  return { ...base, unallocated };
}
