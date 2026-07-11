/**
 * SSR stock allocations by product for product detail (REQ-0066).
 * Mirrors GET /api/stock-allocations?productId=xxx.
 */
import { prisma } from "@/prisma/client";
import { getProductDetailForPage } from "@/lib/server/product-detail-data";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
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
  productMap: Map<string, { name: string; sku: string; imageUrl: string | null }>,
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

/** Per-warehouse allocations for a product the user can access. */
export async function getStockByProductForPage(
  session: SessionForDetail,
  productId: string,
): Promise<StockAllocation[] | null> {
  const product = await getProductDetailForPage(session, productId);
  if (!product) return null;

  const allocations = await prisma.stockAllocation.findMany({
    where: { productId },
    orderBy: { quantity: "desc" },
  });

  if (allocations.length === 0) return [];

  const warehouseIds = [...new Set(allocations.map((a) => a.warehouseId))];
  const [productRow, warehouses] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sku: true, imageUrl: true },
    }),
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds }, userId: session.id },
      select: { id: true, name: true },
    }),
  ]);

  const productMap = new Map(
    productRow
      ? [[productRow.id, { name: productRow.name, sku: productRow.sku, imageUrl: productRow.imageUrl ?? null }]]
      : [],
  );
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

  return allocations
    .filter((a) => warehouseMap.has(a.warehouseId))
    .map((a) => transformAllocation(a, productMap, warehouseMap));
}
