/**
 * REQ-0085 — aggregate available/reserved units from stock allocation rows.
 * Used by product insights enrich (SSR + client) and warehouse insights compute.
 */

import type { StockAllocation } from "@/types";

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
