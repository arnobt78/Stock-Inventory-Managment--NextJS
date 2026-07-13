/**
 * REQ-0103 — display-only committed quantity for product lists.
 * DB fields stay disjoint; lists expose committedQuantity for badges/available.
 */

import { prisma } from "@/prisma/client";
import { getReservedCommitment } from "@/lib/stock-allocation/catalog-quantity-reconcile";

/** Sum allocation.reservedQuantity per product (one query). */
export async function batchSumAllocationReserved(
  productIds: string[],
): Promise<Map<string, number>> {
  const sums = new Map<string, number>();
  if (productIds.length === 0) return sums;

  const rows = await prisma.stockAllocation.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, reservedQuantity: true },
  });

  for (const row of rows) {
    const prev = sums.get(row.productId) ?? 0;
    sums.set(row.productId, prev + Number(row.reservedQuantity ?? 0));
  }

  return sums;
}

/** Effective pending commitment for list display (disjoint paths summed). */
export function computeCommittedQuantity(
  productReserved: number,
  allocationReservedSum: number,
): number {
  return getReservedCommitment(productReserved, [
    {
      id: "sum",
      quantity: 0,
      reservedQuantity: allocationReservedSum,
    },
  ]);
}

export type ProductWithCommittedFields = {
  reservedQuantity?: number | null;
  committedQuantity?: number;
};

/** Attach committedQuantity without mutating reservedQuantity. */
export function withCommittedQuantity<
  T extends { id: string; reservedQuantity?: number | null },
>(product: T, allocationReservedSum: number): T & { committedQuantity: number } {
  const productReserved = Number(product.reservedQuantity ?? 0);
  return {
    ...product,
    committedQuantity: computeCommittedQuantity(
      productReserved,
      allocationReservedSum,
    ),
  };
}

/** Batch-enrich a product list response. */
export async function enrichProductsWithCommittedQuantity<
  T extends { id: string; reservedQuantity?: number | null },
>(products: T[]): Promise<Array<T & { committedQuantity: number }>> {
  const allocationSums = await batchSumAllocationReserved(
    products.map((p) => p.id),
  );
  return products.map((product) =>
    withCommittedQuantity(
      product,
      allocationSums.get(product.id) ?? 0,
    ),
  );
}

/** REQ-0105 — single product detail/API enrich (one allocation sum query). */
export async function enrichProductDetailWithCommittedQuantity<
  T extends { id: string; reservedQuantity?: number | null },
>(product: T): Promise<T & { committedQuantity: number }> {
  const allocationSums = await batchSumAllocationReserved([product.id]);
  return withCommittedQuantity(
    product,
    allocationSums.get(product.id) ?? 0,
  );
}

/** Read committed qty from a list row (display-only). */
export function getDisplayCommittedQuantity(
  product: ProductWithCommittedFields,
): number {
  return (
    product.committedQuantity ?? Number(product.reservedQuantity ?? 0)
  );
}
