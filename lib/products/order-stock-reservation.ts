/**
 * REQ-0103 — disjoint pending-order stock reservation (REQ-0102 AC6).
 * Warehouse pick → allocation.reservedQuantity only.
 * No warehouse pick → product.reservedQuantity only.
 */

import { prisma } from "@/prisma/client";
import { getReservedCommitment } from "@/lib/stock-allocation/catalog-quantity-reconcile";
import type { CatalogReconcileAllocationRow } from "@/lib/stock-allocation/catalog-quantity-reconcile";
import { decrementStockAllocations } from "@/lib/products/decrement-stock-allocations";
import {
  fulfillAllocationFromPick,
  releaseAllocationReservation,
  reserveAllocationForOrderItem,
} from "@/lib/products/stock-allocation-order-sync";

export type OrderStockLine = {
  productId: string;
  quantity: number;
  warehouseId?: string | null;
};

/** Catalog units still available for a new pending order line. */
export function getAvailableCatalogForOrder(
  productQty: number,
  productReserved: number,
  allocationRows: Pick<CatalogReconcileAllocationRow, "reservedQuantity">[],
): number {
  const committed = getReservedCommitment(
    productReserved,
    allocationRows.map((row, index) => ({
      id: String(index),
      quantity: 0,
      reservedQuantity: row.reservedQuantity,
    })),
  );
  return Math.max(0, productQty - committed);
}

/** Pending create — reserve on exactly one path per line. */
export async function reservePendingOrderLine(
  line: OrderStockLine,
): Promise<void> {
  if (line.warehouseId) {
    await reserveAllocationForOrderItem(
      line.productId,
      line.warehouseId,
      line.quantity,
    );
    return;
  }

  await prisma.product.update({
    where: { id: line.productId },
    data: {
      reservedQuantity: { increment: line.quantity },
    },
  });
}

/** Pending cancel — release reservation on exactly one path per line. */
export async function releasePendingOrderLine(
  line: OrderStockLine,
): Promise<void> {
  if (line.warehouseId) {
    await releaseAllocationReservation(
      line.productId,
      line.warehouseId,
      line.quantity,
    );
    return;
  }

  await prisma.product.update({
    where: { id: line.productId },
    data: {
      reservedQuantity: { decrement: line.quantity },
    },
  });
}

/** Pending → confirmed/paid — deduct catalog and clear reservation on one path. */
export async function fulfillPendingOrderLine(
  line: OrderStockLine,
): Promise<void> {
  if (line.warehouseId) {
    await prisma.product.update({
      where: { id: line.productId },
      data: {
        quantity: { decrement: line.quantity },
      },
    });
    await fulfillAllocationFromPick(
      line.productId,
      line.warehouseId,
      line.quantity,
      { releaseReservation: true },
    );
    return;
  }

  await prisma.product.update({
    where: { id: line.productId },
    data: {
      quantity: { decrement: line.quantity },
      reservedQuantity: { decrement: line.quantity },
    },
  });

  await decrementStockAllocations([
    {
      productId: line.productId,
      quantity: line.quantity,
    },
  ]);
}

/** Batch reserve after order create. */
export async function reservePendingOrderLines(
  lines: OrderStockLine[],
): Promise<void> {
  for (const line of lines) {
    await reservePendingOrderLine(line);
  }
}

/** Batch release on pending cancel. */
export async function releasePendingOrderLines(
  lines: OrderStockLine[],
): Promise<void> {
  for (const line of lines) {
    try {
      await releasePendingOrderLine(line);
    } catch {
      // best-effort — mirrors syncReleasePendingOrderAllocations
    }
  }
}

/** Batch fulfill on pending → confirmed/paid. */
export async function fulfillPendingOrderLines(
  lines: OrderStockLine[],
): Promise<void> {
  for (const line of lines) {
    try {
      await fulfillPendingOrderLine(line);
    } catch {
      // best-effort — mirrors decrementStockAllocations warn-only callers
    }
  }
}
