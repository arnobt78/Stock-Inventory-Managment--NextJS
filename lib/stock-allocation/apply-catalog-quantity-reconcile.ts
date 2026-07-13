/**
 * REQ-0102 — apply catalog reconcile shrink in a Prisma transaction.
 */

import { prisma } from "@/prisma/client";
import type { AllocationDecrementStep } from "@/lib/products/plan-allocation-decrements";

export type ApplyCatalogReconcileInput = {
  productId: string;
  newCatalog: number;
  shrinkSteps: AllocationDecrementStep[];
  /** Additional product fields from PUT body */
  productUpdate: Record<string, unknown>;
};

export type ApplyCatalogReconcileResult = {
  unitsRemovedFromWarehouses: number;
};

/** Update catalog qty and shrink allocation rows; delete rows that reach zero. */
export async function applyCatalogQuantityReconcile(
  input: ApplyCatalogReconcileInput,
): Promise<ApplyCatalogReconcileResult> {
  const { productId, newCatalog, shrinkSteps, productUpdate } = input;
  const unitsRemovedFromWarehouses = shrinkSteps.reduce(
    (sum, step) => sum + step.deduct,
    0,
  );

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        ...productUpdate,
        quantity: BigInt(newCatalog) as never,
      },
    });

    for (const step of shrinkSteps) {
      const updated = await tx.stockAllocation.update({
        where: { id: step.id },
        data: {
          quantity: { decrement: step.deduct },
          updatedAt: new Date(),
        },
        select: { quantity: true },
      });
      if (Number(updated.quantity) <= 0) {
        await tx.stockAllocation.delete({ where: { id: step.id } });
      }
    }
  });

  return { unitsRemovedFromWarehouses };
}
