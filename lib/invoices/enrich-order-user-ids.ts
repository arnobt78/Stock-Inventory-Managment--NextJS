/**
 * Batch-resolve order placer (order.userId) for invoice list DTOs.
 */

import { prisma } from "@/prisma/client";

/** Map orderId → userId who placed the order */
export async function fetchOrderUserIdMap(
  orderIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(orderIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const orders = await prisma.order.findMany({
    where: { id: { in: unique } },
    select: { id: true, userId: true },
  });

  return new Map(orders.map((o) => [o.id, o.userId]));
}
