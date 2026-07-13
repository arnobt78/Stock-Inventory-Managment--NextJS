/**
 * SSR stock allocations by product for product detail (REQ-0066).
 * Mirrors GET /api/stock-allocations?productId=xxx with shared enrich (REQ-0102).
 */
import { prisma } from "@/prisma/client";
import { getProductDetailForPage } from "@/lib/server/product-detail-data";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import {
  fetchStockAllocationProductMap,
  transformStockAllocationRow,
  enrichStockAllocationRows,
} from "@/lib/stock-allocation/stock-allocation-enrich";
import type { StockAllocation } from "@/types";

/** Per-warehouse allocations for a product the user can access. */
export async function getStockByProductForPage(
  session: SessionForDetail,
  productId: string,
): Promise<StockAllocation[] | null> {
  const product = await getProductDetailForPage(session, productId);
  if (!product) return null;

  // Warehouses belong to the product owner (admin), not the viewing session (REQ-0075 AC1).
  const ownerUserId = product.userId;

  const allocations = await prisma.stockAllocation.findMany({
    where: { productId },
    orderBy: { quantity: "desc" },
  });

  if (allocations.length === 0) return [];

  const warehouseIds = [...new Set(allocations.map((a) => a.warehouseId))];

  const [productMap, warehouses] = await Promise.all([
    fetchStockAllocationProductMap([productId]),
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds }, userId: ownerUserId },
      select: { id: true, name: true, status: true },
    }),
  ]);

  const warehouseMap = new Map(
    warehouses.map((w) => [w.id, { name: w.name, status: Boolean(w.status) }]),
  );

  const rows = allocations
    .filter((a) => warehouseMap.has(a.warehouseId))
    .map((a) => transformStockAllocationRow(a, productMap, warehouseMap));

  return enrichStockAllocationRows(rows);
}
