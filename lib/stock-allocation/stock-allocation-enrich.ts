/**
 * Shared product enrichment for stock allocation API + SSR (price, catalog meta).
 */
import { prisma } from "@/prisma/client";
import type { StockAllocation } from "@/types";

export type StockAllocationWarehouseSnapshot = {
  name: string;
  status: boolean;
};

export type StockAllocationProductSnapshot = {
  name: string;
  sku: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  categoryName: string | null;
  supplierName: string | null;
};

type AllocationRow = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: unknown;
  reservedQuantity: unknown;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
};

/** Batch-load product + category + supplier labels for allocation rows. */
export async function fetchStockAllocationProductMap(
  productIds: string[],
): Promise<Map<string, StockAllocationProductSnapshot>> {
  if (productIds.length === 0) return new Map();

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      sku: true,
      imageUrl: true,
      price: true,
      quantity: true,
      categoryId: true,
      supplierId: true,
    },
  });

  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
  const supplierIds = [...new Set(products.map((p) => p.supplierId))];

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  return new Map(
    products.map((p) => [
      p.id,
      {
        name: p.name,
        sku: p.sku,
        imageUrl: p.imageUrl ?? null,
        price: p.price,
        quantity: Number(p.quantity),
        categoryName: categoryMap.get(p.categoryId) ?? null,
        supplierName: supplierMap.get(p.supplierId) ?? null,
      },
    ]),
  );
}

export function transformStockAllocationRow(
  row: AllocationRow,
  productMap: Map<string, StockAllocationProductSnapshot>,
  warehouseMap: Map<string, StockAllocationWarehouseSnapshot>,
): StockAllocation {
  const product = productMap.get(row.productId);
  const warehouse = warehouseMap.get(row.warehouseId);
  return {
    id: row.id,
    productId: row.productId,
    warehouseId: row.warehouseId,
    quantity: Number(row.quantity),
    reservedQuantity: Number(row.reservedQuantity),
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
    product: product
      ? {
          id: row.productId,
          name: product.name,
          sku: product.sku,
          imageUrl: product.imageUrl,
          price: product.price,
          quantity: product.quantity,
          categoryName: product.categoryName,
          supplierName: product.supplierName,
        }
      : undefined,
    warehouse: warehouse
      ? {
          id: row.warehouseId,
          name: warehouse.name,
          status: warehouse.status,
        }
      : undefined,
  };
}
