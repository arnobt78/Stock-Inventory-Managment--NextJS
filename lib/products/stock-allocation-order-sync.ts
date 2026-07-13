/**
 * REQ-0068 — per-warehouse order picking sync between OrderItem and StockAllocation.
 * Reserves allocation rows on pending create; fulfills/restores on confirm/cancel.
 *
 * REQ-0102 reservation invariant:
 * - Warehouse-pick orders → `StockAllocation.reservedQuantity` only
 * - No warehouse pick (greedy fallback) → `Product.reservedQuantity` only
 * These paths are disjoint; catalog reconcile sums both for the reserved floor.
 */

import { prisma } from "@/prisma/client";

export type WarehousePickOption = {
  warehouseId: string;
  warehouseName: string;
  available: number;
};

export type OrderLineAllocationRef = {
  productId: string;
  warehouseId: string | null;
  quantity: number;
};

/** Warehouses with available stock for a product (owner-scoped). */
export async function getProductAllocationWarehouses(
  productId: string,
  ownerUserId: string,
): Promise<WarehousePickOption[]> {
  const allocations = await prisma.stockAllocation.findMany({
    where: { productId },
    select: {
      warehouseId: true,
      quantity: true,
      reservedQuantity: true,
    },
  });

  if (allocations.length === 0) return [];

  const warehouseIds = [...new Set(allocations.map((a) => a.warehouseId))];
  const warehouses = await prisma.warehouse.findMany({
    where: { id: { in: warehouseIds }, userId: ownerUserId },
    select: { id: true, name: true },
  });
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

  const options: WarehousePickOption[] = [];
  for (const allocation of allocations) {
    const name = warehouseMap.get(allocation.warehouseId);
    if (!name) continue;
    const available =
      Number(allocation.quantity) - Number(allocation.reservedQuantity ?? 0);
    if (available <= 0) continue;
    options.push({
      warehouseId: allocation.warehouseId,
      warehouseName: name,
      available,
    });
  }

  return options.sort((a, b) => b.available - a.available);
}

/** True when the product owner has at least one warehouse allocation row. */
export async function productRequiresWarehousePick(
  productId: string,
  ownerUserId: string,
): Promise<boolean> {
  const allocations = await prisma.stockAllocation.findMany({
    where: { productId },
    select: { warehouseId: true },
  });
  if (allocations.length === 0) return false;

  const warehouseIds = allocations.map((a) => a.warehouseId);
  const ownedCount = await prisma.warehouse.count({
    where: { id: { in: warehouseIds }, userId: ownerUserId },
  });
  return ownedCount > 0;
}

/** Resolve warehouse name for order line snapshot. */
export async function resolveWarehouseName(
  warehouseId: string,
  ownerUserId: string,
): Promise<string | null> {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, userId: ownerUserId },
    select: { name: true },
  });
  return warehouse?.name ?? null;
}

/** Validate picked warehouse has enough available stock (quantity − reserved). */
export async function validateWarehousePick(
  productId: string,
  warehouseId: string,
  quantity: number,
): Promise<void> {
  const allocation = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
    select: { quantity: true, reservedQuantity: true },
  });

  if (!allocation) {
    throw new Error(
      `No stock allocation for product ${productId} at warehouse ${warehouseId}`,
    );
  }

  const available =
    Number(allocation.quantity) - Number(allocation.reservedQuantity ?? 0);
  if (available < quantity) {
    throw new Error(
      `Insufficient warehouse stock. Available: ${available}, Requested: ${quantity}`,
    );
  }
}

/** Pending order create — reserve allocation row for the picked warehouse. */
export async function reserveAllocationForOrderItem(
  productId: string,
  warehouseId: string,
  quantity: number,
): Promise<void> {
  await validateWarehousePick(productId, warehouseId, quantity);
  await prisma.stockAllocation.update({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
    data: {
      reservedQuantity: { increment: quantity },
      updatedAt: new Date(),
    },
  });
}

/** Pending order cancel — release allocation reservation only. */
export async function releaseAllocationReservation(
  productId: string,
  warehouseId: string,
  quantity: number,
): Promise<void> {
  const allocation = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
  });
  if (!allocation) return;

  await prisma.stockAllocation.update({
    where: { id: allocation.id },
    data: {
      reservedQuantity: { decrement: quantity },
      updatedAt: new Date(),
    },
  });
}

/**
 * Confirm/paid from pending — deduct allocation quantity and release reservation.
 * Reactivated orders pass releaseReservation=false (no reservation left).
 */
export async function fulfillAllocationFromPick(
  productId: string,
  warehouseId: string,
  quantity: number,
  options?: { releaseReservation?: boolean },
): Promise<void> {
  const releaseReservation = options?.releaseReservation ?? true;
  const allocation = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
  });
  if (!allocation) {
    throw new Error(
      `No stock allocation for product ${productId} at warehouse ${warehouseId}`,
    );
  }

  await prisma.stockAllocation.update({
    where: { id: allocation.id },
    data: {
      quantity: { decrement: quantity },
      ...(releaseReservation
        ? { reservedQuantity: { decrement: quantity } }
        : {}),
      updatedAt: new Date(),
    },
  });
}

/** Confirmed/paid order cancel — restore allocation quantity at picked warehouse. */
export async function restoreAllocationOnCancelConfirmed(
  productId: string,
  warehouseId: string,
  quantity: number,
): Promise<void> {
  const allocation = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
  });
  if (!allocation) return;

  await prisma.stockAllocation.update({
    where: { id: allocation.id },
    data: {
      quantity: { increment: quantity },
      updatedAt: new Date(),
    },
  });
}

/** Best-effort sync for order line items — logs warnings, never throws. */
export async function syncReleasePendingOrderAllocations(
  items: OrderLineAllocationRef[],
): Promise<void> {
  for (const item of items) {
    if (!item.warehouseId) continue;
    try {
      await releaseAllocationReservation(
        item.productId,
        item.warehouseId,
        item.quantity,
      );
    } catch {
      // non-blocking
    }
  }
}

export async function syncFulfillPendingOrderAllocations(
  items: OrderLineAllocationRef[],
): Promise<void> {
  for (const item of items) {
    if (!item.warehouseId) continue;
    try {
      await fulfillAllocationFromPick(
        item.productId,
        item.warehouseId,
        item.quantity,
        { releaseReservation: true },
      );
    } catch {
      // non-blocking
    }
  }
}

export async function syncRestoreConfirmedOrderAllocations(
  items: OrderLineAllocationRef[],
): Promise<void> {
  for (const item of items) {
    if (!item.warehouseId) continue;
    try {
      await restoreAllocationOnCancelConfirmed(
        item.productId,
        item.warehouseId,
        item.quantity,
      );
    } catch {
      // non-blocking
    }
  }
}

export async function syncFulfillReactivatedOrderAllocations(
  items: OrderLineAllocationRef[],
): Promise<void> {
  for (const item of items) {
    if (!item.warehouseId) continue;
    try {
      await fulfillAllocationFromPick(
        item.productId,
        item.warehouseId,
        item.quantity,
        { releaseReservation: false },
      );
    } catch {
      // non-blocking
    }
  }
}
