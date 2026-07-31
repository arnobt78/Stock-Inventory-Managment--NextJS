/**
 * Shared product enrichment for stock allocation API + SSR (price, catalog meta).
 */
import { prisma } from "@/prisma/client";
import { isProductArchived } from "@/lib/products/product-query";
import {
  batchSumAllocationReserved,
  computeCommittedQuantity,
} from "@/lib/products/enrich-product-committed-quantity";
import type { StockAllocation } from "@/types";

export type StockAllocationWarehouseSnapshot = {
  name: string;
  status: boolean;
  address?: string | null;
  type?: string | null;
};

export type StockAllocationProductSnapshot = {
  name: string;
  sku: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  deletedAt: string | null;
  isArchived: boolean;
  reservedQuantity: number;
  committedQuantity?: number;
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
      deletedAt: true,
      reservedQuantity: true,
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
  const allocationSums = await batchSumAllocationReserved(products.map((p) => p.id));

  return new Map(
    products.map((p) => {
      const allocSum = allocationSums.get(p.id) ?? 0;
      const productReserved = Number(p.reservedQuantity ?? 0);
      return [
        p.id,
        {
          name: p.name,
          sku: p.sku,
          imageUrl: p.imageUrl ?? null,
          price: p.price,
          quantity: Number(p.quantity),
          categoryId: p.categoryId ?? null,
          categoryName: categoryMap.get(p.categoryId) ?? null,
          supplierId: p.supplierId ?? null,
          supplierName: supplierMap.get(p.supplierId) ?? null,
          deletedAt: p.deletedAt?.toISOString() ?? null,
          isArchived: isProductArchived(p),
          reservedQuantity: productReserved,
          committedQuantity: computeCommittedQuantity(productReserved, allocSum),
        },
      ];
    }),
  );
}

export type ProductAllocationTotals = {
  allocatedTotal: number;
  unallocated: number;
};

/** Cross-warehouse allocated/unallocated per product (warehouse rows need full sibling set). */
export async function getProductAllocationTotalsMap(
  productIds: string[],
): Promise<Map<string, ProductAllocationTotals>> {
  if (productIds.length === 0) return new Map();

  const [allocations, products] = await Promise.all([
    prisma.stockAllocation.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, quantity: true },
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, quantity: true },
    }),
  ]);

  const catalogByProduct = new Map(
    products.map((p) => [p.id, Number(p.quantity)]),
  );
  const allocatedByProduct = new Map<string, number>();
  for (const row of allocations) {
    allocatedByProduct.set(
      row.productId,
      (allocatedByProduct.get(row.productId) ?? 0) + Number(row.quantity),
    );
  }

  const totalsMap = new Map<string, ProductAllocationTotals>();
  for (const productId of productIds) {
    const catalogQty = catalogByProduct.get(productId);
    if (catalogQty == null) continue;
    const allocatedTotal = allocatedByProduct.get(productId) ?? 0;
    totalsMap.set(productId, {
      allocatedTotal,
      unallocated: Math.max(0, catalogQty - allocatedTotal),
    });
  }

  return totalsMap;
}

/** Merge derived catalog totals onto allocation row product snapshots. */
export function attachProductAllocationTotals(
  rows: StockAllocation[],
  totalsMap: Map<string, ProductAllocationTotals>,
): StockAllocation[] {
  return rows.map((row) => {
    const totals = totalsMap.get(row.productId);
    if (!totals || !row.product) return row;

    return {
      ...row,
      product: {
        ...row.product,
        allocatedTotal: totals.allocatedTotal,
        unallocated: totals.unallocated,
      },
    };
  });
}

/**
 * REQ-0102 — sole production entry for API + SSR allocation lists.
 * DB-backed cross-warehouse totals: warehouse-scoped rows are partial per product.
 */
export async function enrichStockAllocationRows(
  rows: StockAllocation[],
): Promise<StockAllocation[]> {
  const productIds = [...new Set(rows.map((row) => row.productId))];
  const totalsMap = await getProductAllocationTotalsMap(productIds);
  return attachProductAllocationTotals(rows, totalsMap);
}

/** Alias for enrichStockAllocationRows — kept for existing tests and imports. */
export const enrichWarehouseAllocationRows = enrichStockAllocationRows;

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
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          supplierId: product.supplierId,
          supplierName: product.supplierName,
          deletedAt: product.deletedAt,
          isArchived: product.isArchived,
          reservedQuantity: product.reservedQuantity,
          committedQuantity: product.committedQuantity,
        }
      : undefined,
    warehouse: warehouse
      ? {
          id: row.warehouseId,
          name: warehouse.name,
          status: warehouse.status,
          address: warehouse.address ?? null,
          type: warehouse.type ?? null,
        }
      : undefined,
  };
}

/**
 * REQ-0221 — POST/PUT allocate responses match GET densify (category/supplier/catalog totals).
 */
export async function densifyStockAllocationWriteResponse(row: {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: unknown;
  reservedQuantity: unknown;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
}): Promise<StockAllocation> {
  const [productMap, warehouses] = await Promise.all([
    fetchStockAllocationProductMap([row.productId]),
    prisma.warehouse.findMany({
      where: { id: { in: [row.warehouseId] } },
      select: {
        id: true,
        name: true,
        status: true,
        address: true,
        type: true,
      },
    }),
  ]);
  const warehouseMap = new Map(
    warehouses.map((w) => [
      w.id,
      {
        name: w.name,
        status: Boolean(w.status),
        address: w.address ?? null,
        type: w.type ?? null,
      },
    ]),
  );
  const transformed = transformStockAllocationRow(
    row,
    productMap,
    warehouseMap,
  );
  const [enriched] = await enrichStockAllocationRows([transformed]);
  return enriched ?? transformed;
}
