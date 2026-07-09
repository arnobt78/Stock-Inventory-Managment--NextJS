/**
 * Server-side order detail fetch for SSR prefetch.
 * Mirrors GET /api/orders/:id auth + response shape.
 */

import {
  getOrderById,
  getOrderByIdForAdmin,
  getOrderByIdForClient,
  getOrderByIdForSupplier,
  getOrderByIdForProductOwner,
} from "@/prisma/order";
import { getSupplierByUserId } from "@/prisma/supplier";
import { prisma } from "@/prisma/client";
import {
  transformOrderDetail,
  type OrderDetailEnrichment,
} from "@/lib/orders/transform-order-detail";
import type { Order } from "@/types";

export type SessionForDetail = {
  id: string;
  role: string | null;
};

async function enrichOrder(orderId: string, order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>): Promise<OrderDetailEnrichment> {
  const placedBy =
    order.userId != null
      ? await prisma.user.findUnique({
          where: { id: order.userId },
          select: { name: true, email: true },
        })
      : null;

  const productOwnerIds = [
    ...new Set(
      (order.items || [])
        .map(
          (item: { product?: { userId?: string } }) =>
            item.product?.userId as string | undefined,
        )
        .filter(Boolean),
    ),
  ] as string[];

  const productOwnerUsers =
    productOwnerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: productOwnerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const invoiceForOrder = await prisma.invoice.findUnique({
    where: { orderId },
    select: { id: true, invoiceNumber: true },
  });

  return {
    placedByName: placedBy?.name ?? placedBy?.email ?? null,
    placedByEmail: placedBy?.email ?? null,
    orderProductOwners: productOwnerUsers.map((u) => ({
      userId: u.id,
      name: u.name ?? null,
      email: u.email,
    })),
    invoiceForOrder: invoiceForOrder
      ? { id: invoiceForOrder.id, invoiceNumber: invoiceForOrder.invoiceNumber }
      : null,
  };
}

/** Role-scoped order detail for page SSR — null when not found or unauthorized. */
export async function getOrderDetailForPage(
  session: SessionForDetail,
  orderId: string,
): Promise<Order | null> {
  const userId = session.id;
  const isAdmin = session.role === "admin";
  const isClient = session.role === "client";
  const isSupplier = session.role === "supplier";

  let order: Awaited<ReturnType<typeof getOrderById>> | null;
  if (isAdmin) {
    order = await getOrderByIdForAdmin(orderId);
  } else if (isClient) {
    order = await getOrderByIdForClient(orderId, userId);
  } else if (isSupplier) {
    const supplier = await getSupplierByUserId(userId);
    order =
      supplier ? await getOrderByIdForSupplier(orderId, supplier.id) : null;
  } else {
    order = await getOrderById(orderId, userId);
    if (!order) {
      order = await getOrderByIdForProductOwner(orderId, userId);
    }
  }

  if (!order) return null;

  const enrichment = await enrichOrder(orderId, order);
  return transformOrderDetail(order, enrichment);
}
