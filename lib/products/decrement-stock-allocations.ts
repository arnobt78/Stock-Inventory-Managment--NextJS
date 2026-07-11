/**
 * Decrement warehouse stock allocations when product-level stock is sold.
 * Greedily deducts from the largest allocation first per product.
 */

import { prisma } from "@/prisma/client";

export interface DecrementStockAllocationItem {
  productId: string;
  quantity: number;
}

/**
 * Best-effort decrement of StockAllocation rows for order line items.
 * Does not throw when allocations are missing or insufficient.
 */
export async function decrementStockAllocations(
  items: DecrementStockAllocationItem[],
): Promise<void> {
  for (const item of items) {
    if (item.quantity <= 0) continue;

    let remaining = item.quantity;

    const allocations = await prisma.stockAllocation.findMany({
      where: { productId: item.productId },
      orderBy: { quantity: "desc" },
    });

    for (const allocation of allocations) {
      if (remaining <= 0) break;

      const available = Number(allocation.quantity);
      if (available <= 0) continue;

      const deduct = Math.min(available, remaining);

      await prisma.stockAllocation.update({
        where: { id: allocation.id },
        data: {
          quantity: { decrement: deduct },
          updatedAt: new Date(),
        },
      });

      remaining -= deduct;
    }
  }
}
