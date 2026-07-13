/**
 * REQ-0102 — block warehouse delete when stock commitments exist.
 */

import { prisma } from "@/prisma/client";
import { isActiveOrderStatus } from "@/lib/products/delete-policy";

export type WarehouseDeleteBlockers = {
  blocked: boolean;
  reasons: string[];
};

/** Returns human-readable blockers before warehouse DELETE. */
export async function getWarehouseDeleteBlockers(
  warehouseId: string,
): Promise<WarehouseDeleteBlockers> {
  const reasons: string[] = [];

  const reservedAllocations = await prisma.stockAllocation.count({
    where: {
      warehouseId,
      reservedQuantity: { gt: 0 },
    },
  });
  if (reservedAllocations > 0) {
    reasons.push(
      `${reservedAllocations} product allocation(s) have reserved stock for active orders.`,
    );
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { warehouseId },
    select: {
      quantity: true,
      order: { select: { status: true } },
    },
  });
  const activeOrderLines = orderItems.filter((item) =>
    isActiveOrderStatus(item.order.status),
  );
  if (activeOrderLines.length > 0) {
    const units = activeOrderLines.reduce((sum, item) => sum + item.quantity, 0);
    reasons.push(
      `${activeOrderLines.length} active order line(s) (${units} unit(s)) pick from this warehouse.`,
    );
  }

  const pendingTransfers = await prisma.stockTransfer.count({
    where: {
      status: "pending",
      OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
    },
  });
  if (pendingTransfers > 0) {
    reasons.push(
      `${pendingTransfers} pending stock transfer(s) involve this warehouse.`,
    );
  }

  return {
    blocked: reasons.length > 0,
    reasons,
  };
}
