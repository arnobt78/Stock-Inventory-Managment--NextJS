/**
 * Store-wide order IDs for a product owner (self orders + client orders on their products).
 */

import { prisma } from "@/prisma/client";

export async function getStoreOrderIds(
  productOwnerUserId: string,
): Promise<string[]> {
  const [selfOrders, clientOrderItems] = await Promise.all([
    prisma.order.findMany({
      where: { userId: productOwnerUserId },
      select: { id: true },
    }),
    prisma.orderItem.findMany({
      where: { product: { userId: productOwnerUserId } },
      select: { orderId: true },
      distinct: ["orderId"],
    }),
  ]);
  const ids = new Set<string>();
  selfOrders.forEach((o) => ids.add(o.id));
  clientOrderItems.forEach((o) => ids.add(o.orderId));
  return Array.from(ids);
}
