/**
 * SSR stock allocations for warehouse detail pages (REQ-0026).
 * Mirrors GET /api/stock-allocations?warehouseId=xxx.
 */
import { prisma } from "@/prisma/client";
import {
  fetchStockAllocationProductMap,
  transformStockAllocationRow,
} from "@/lib/stock-allocation/stock-allocation-enrich";
import type { StockAllocation } from "@/types";

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

  const [productMap, warehouses] = await Promise.all([
    fetchStockAllocationProductMap(productIds),
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true, status: true },
    }),
  ]);

  const warehouseMap = new Map(
    warehouses.map((w) => [w.id, { name: w.name, status: Boolean(w.status) }]),
  );

  return allocations.map((a) =>
    transformStockAllocationRow(a, productMap, warehouseMap),
  );
}
