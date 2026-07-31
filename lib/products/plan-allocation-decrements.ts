/**
 * REQ-0066 hardening — pure planner for greedy warehouse allocation decrements.
 * Uses available = quantity − reservedQuantity; largest available first.
 */

export type AllocationRow = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  /** Optional — carried onto shrink steps for client cache patch (REQ-0225) */
  warehouseId?: string;
};

export type AllocationDecrementStep = {
  id: string;
  deduct: number;
  warehouseId?: string;
};

/** Greedy decrement plan (largest available allocation first). */
export function planAllocationDecrements(
  allocations: AllocationRow[],
  requestedQty: number,
): AllocationDecrementStep[] {
  if (requestedQty <= 0) return [];

  let remaining = requestedQty;
  const sorted = [...allocations].sort((a, b) => {
    const availA = a.quantity - a.reservedQuantity;
    const availB = b.quantity - b.reservedQuantity;
    return availB - availA;
  });

  const steps: AllocationDecrementStep[] = [];

  for (const row of sorted) {
    if (remaining <= 0) break;

    const available = row.quantity - row.reservedQuantity;
    if (available <= 0) continue;

    const deduct = Math.min(available, remaining);
    steps.push({
      id: row.id,
      deduct,
      ...(row.warehouseId ? { warehouseId: row.warehouseId } : {}),
    });
    remaining -= deduct;
  }

  return steps;
}
