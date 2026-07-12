/**
 * SSR stock allocations for warehouse detail pages (REQ-0026).
 * REQ-0084 — admin can load any warehouse allocations (mirrors warehouse detail access).
 */
import { prisma } from "@/prisma/client";
import {
  fetchStockAllocationProductMap,
  transformStockAllocationRow,
} from "@/lib/stock-allocation/stock-allocation-enrich";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import type { StockAllocation } from "@/types";

/** Stock rows for a warehouse the session user can access. */
export async function getStockByWarehouseForPage(
  session: SessionForDetail,
  warehouseId: string,
): Promise<StockAllocation[] | null> {
  const isAdmin = session.role === "admin";
  const warehouse = await prisma.warehouse.findFirst({
    where: isAdmin ? { id: warehouseId } : { id: warehouseId, userId: session.id },
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
