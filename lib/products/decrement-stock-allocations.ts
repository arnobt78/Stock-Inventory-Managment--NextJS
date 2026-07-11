/**
 * Decrement warehouse stock allocations when product-level stock is sold.
 * Greedily deducts from the largest **available** allocation first per product.
 */

import { prisma } from "@/prisma/client";
import { planAllocationDecrements } from "@/lib/products/plan-allocation-decrements";

export interface DecrementStockAllocationItem {
  productId: string;
  quantity: number;
}

/**
 * Best-effort decrement of StockAllocation rows for order line items.
 * Uses quantity − reservedQuantity as available; does not throw when insufficient.
 */
export async function decrementStockAllocations(
  items: DecrementStockAllocationItem[],
): Promise<void> {
  for (const item of items) {
    if (item.quantity <= 0) continue;

    const allocations = await prisma.stockAllocation.findMany({
      where: { productId: item.productId },
      select: { id: true, quantity: true, reservedQuantity: true },
    });

    const steps = planAllocationDecrements(
      allocations.map((a) => ({
        id: a.id,
        quantity: Number(a.quantity),
        reservedQuantity: Number(a.reservedQuantity),
      })),
      item.quantity,
    );

    for (const step of steps) {
      await prisma.stockAllocation.update({
        where: { id: step.id },
        data: {
          quantity: { decrement: step.deduct },
          updatedAt: new Date(),
        },
      });
    }
  }
}
