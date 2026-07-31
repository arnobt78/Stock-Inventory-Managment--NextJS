/**
 * Stock Allocation & Transfer Prisma helpers
 */

import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import type {
  CreateStockAllocationInput,
  UpdateStockAllocationInput,
  CreateStockTransferInput,
} from "@/types";

/**
 * Get all stock allocations for a user's products
 */
export async function getStockAllocations(userId: string) {
  // Get all products for this user
  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ userId }),
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  return prisma.stockAllocation.findMany({
    where: { productId: { in: productIds } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get stock allocations for a specific product
 */
export async function getStockAllocationsByProduct(productId: string) {
  return prisma.stockAllocation.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get stock allocations for a specific warehouse
 */
export async function getStockAllocationsByWarehouse(warehouseId: string) {
  return prisma.stockAllocation.findMany({
    where: { warehouseId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single stock allocation
 */
export async function getStockAllocationById(id: string) {
  return prisma.stockAllocation.findUnique({
    where: { id },
  });
}

/**
 * Create or update stock allocation (upsert)
 */
export async function upsertStockAllocation(
  data: CreateStockAllocationInput,
  userId: string,
) {
  const existing = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: {
        productId: data.productId,
        warehouseId: data.warehouseId,
      },
    },
  });

  if (existing) {
    return prisma.stockAllocation.update({
      where: { id: existing.id },
      data: {
        quantity: data.quantity,
        updatedAt: new Date(),
      },
    });
  }

  return prisma.stockAllocation.create({
    data: {
      productId: data.productId,
      warehouseId: data.warehouseId,
      quantity: data.quantity,
      userId,
      createdAt: new Date(),
    },
  });
}

/**
 * Update stock allocation
 */
export async function updateStockAllocation(
  id: string,
  data: UpdateStockAllocationInput,
) {
  return prisma.stockAllocation.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete stock allocation
 */
export async function deleteStockAllocation(id: string) {
  return prisma.stockAllocation.delete({
    where: { id },
  });
}

/**
 * Get all stock transfers for a user's products
 */
export async function getStockTransfers(userId: string) {
  return prisma.stockTransfer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single stock transfer
 */
export async function getStockTransferById(id: string) {
  return prisma.stockTransfer.findUnique({
    where: { id },
  });
}

/**
 * Create a stock transfer (pending)
 */
export async function createStockTransfer(
  data: CreateStockTransferInput,
  userId: string,
) {
  // Validate that source has enough stock
  const sourceAllocation = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: {
        productId: data.productId,
        warehouseId: data.fromWarehouseId,
      },
    },
  });

  if (!sourceAllocation) {
    throw new Error(
      "Source warehouse has no stock allocation for this product",
    );
  }

  const availableStock =
    Number(sourceAllocation.quantity) -
    Number(sourceAllocation.reservedQuantity);
  if (availableStock < data.quantity) {
    throw new Error(
      `Insufficient stock in source warehouse. Available: ${availableStock}, Requested: ${data.quantity}`,
    );
  }

  return prisma.stockTransfer.create({
    data: {
      productId: data.productId,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      quantity: data.quantity,
      status: "pending",
      notes: data.notes || null,
      userId,
      createdAt: new Date(),
    },
  });
}

/**
 * Complete a stock transfer
 */
export async function completeStockTransfer(id: string, userId: string) {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
  });

  if (!transfer) {
    throw new Error("Transfer not found");
  }

  if (transfer.status !== "pending") {
    throw new Error("Transfer is not pending");
  }

  // Deduct from source warehouse
  await prisma.stockAllocation.update({
    where: {
      productId_warehouseId: {
        productId: transfer.productId,
        warehouseId: transfer.fromWarehouseId,
      },
    },
    data: {
      quantity: { decrement: Number(transfer.quantity) },
      updatedAt: new Date(),
    },
  });

  // Add to destination warehouse (create if doesn't exist)
  const destAllocation = await prisma.stockAllocation.findUnique({
    where: {
      productId_warehouseId: {
        productId: transfer.productId,
        warehouseId: transfer.toWarehouseId,
      },
    },
  });

  if (destAllocation) {
    await prisma.stockAllocation.update({
      where: { id: destAllocation.id },
      data: {
        quantity: { increment: Number(transfer.quantity) },
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.stockAllocation.create({
      data: {
        productId: transfer.productId,
        warehouseId: transfer.toWarehouseId,
        quantity: transfer.quantity,
        userId,
        createdAt: new Date(),
      },
    });
  }

  // Mark transfer as completed
  return prisma.stockTransfer.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });
}

/**
 * Cancel a stock transfer
 */
export async function cancelStockTransfer(id: string) {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
  });

  if (!transfer) {
    throw new Error("Transfer not found");
  }

  if (transfer.status !== "pending") {
    throw new Error("Transfer is not pending");
  }

  return prisma.stockTransfer.update({
    where: { id },
    data: {
      status: "cancelled",
    },
  });
}

/**
 * Get warehouse stock summary (for analytics)
 */
export async function getWarehouseStockSummary(userId: string) {
  // Get all products for this user
  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ userId }),
    select: { id: true, price: true },
  });
  const productIds = products.map((p) => p.id);
  const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]));

  // Get all warehouses
  const warehouses = await prisma.warehouse.findMany({
    where: { userId },
    select: { id: true, name: true, type: true },
  });

  // Get all stock allocations
  const allocations = await prisma.stockAllocation.findMany({
    where: { productId: { in: productIds } },
  });

  // Build summary per warehouse
  const summary = warehouses.map((wh) => {
    const warehouseAllocations = allocations.filter(
      (a) => a.warehouseId === wh.id,
    );
    const totalProducts = warehouseAllocations.length;
    const totalQuantity = warehouseAllocations.reduce(
      (sum, a) => sum + Number(a.quantity),
      0,
    );
    const totalReserved = warehouseAllocations.reduce(
      (sum, a) => sum + Number(a.reservedQuantity),
      0,
    );
    const totalValue = warehouseAllocations.reduce((sum, a) => {
      const price = priceMap.get(a.productId) || 0;
      return sum + Number(a.quantity) * price;
    }, 0);

    return {
      warehouseId: wh.id,
      warehouseName: wh.name,
      warehouseType: wh.type ?? null,
      totalProducts,
      totalQuantity,
      totalReserved,
      totalValue,
    };
  });

  return summary;
}
