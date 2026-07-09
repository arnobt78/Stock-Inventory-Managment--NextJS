/**
 * SSR stock allocations for warehouse detail pages (REQ-0026).
 * Mirrors GET /api/stock-allocations?warehouseId=xxx.
 */
import { prisma } from "@/prisma/client";
import type { StockAllocation } from "@/types";

function transformAllocation(
  r: {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: unknown;
    reservedQuantity: unknown;
    userId: string;
    createdAt: Date;
    updatedAt: Date | null;
  },
  productMap: Map<string, { name: string; sku: string }>,
  warehouseMap: Map<string, string>,
): StockAllocation {
  return {
    id: r.id,
    productId: r.productId,
    warehouseId: r.warehouseId,
    quantity: Number(r.quantity),
    reservedQuantity: Number(r.reservedQuantity),
    userId: r.userId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
    product: productMap.has(r.productId)
      ? { id: r.productId, ...productMap.get(r.productId)! }
      : undefined,
    warehouse: warehouseMap.has(r.warehouseId)
      ? { id: r.warehouseId, name: warehouseMap.get(r.warehouseId)! }
      : undefined,
  };
}

/** Stock rows for a warehouse owned by the session user. */
export async function getStockByWarehouseForPage(
  userId: string,
  warehouseId: string,
): Promise<StockAllocation[] | null> {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, userId },
  });
  if (!warehouse) return null;

  const allocations = await prisma.stockAllocation.findMany({
    where: { warehouseId },
    orderBy: { createdAt: "desc" },
  });

  const productIds = [...new Set(allocations.map((a) => a.productId))];
  const warehouseIds = [...new Set(allocations.map((a) => a.warehouseId))];

  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    }),
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true },
    }),
  ]);

  const productMap = new Map(
    products.map((p) => [p.id, { name: p.name, sku: p.sku }]),
  );
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

  return allocations.map((a) =>
    transformAllocation(a, productMap, warehouseMap),
  );
}
