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
import { enrichOrderItemsCatalogNames } from "@/lib/orders/enrich-order-items-catalog";
import { toParty } from "@/lib/server/catalog-party-snapshot";
import { resolveBuyerUserId } from "@/lib/orders/order-party";
import type { Order } from "@/types";

export type SessionForDetail = {
  id: string;
  role: string | null;
};

async function enrichOrder(orderId: string, order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>): Promise<OrderDetailEnrichment> {
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

  const buyerUserId = resolveBuyerUserId({
    userId: order.userId,
    clientId: order.clientId,
  });
  const userIds = [
    order.userId,
    order.clientId,
    buyerUserId,
    order.createdBy,
    order.updatedBy,
    ...productOwnerIds,
  ].filter(Boolean) as string[];
  const uniqueUserIds = [...new Set(userIds)];

  const users =
    uniqueUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  // REQ-0158 — placedBy = buyer (clientId) when distinct; else store owner
  const placedBy = userMap.get(buyerUserId) ?? null;

  const productOwnerUsers = productOwnerIds
    .map((id) => userMap.get(id))
    .filter(Boolean) as Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;

  const invoiceForOrder = await prisma.invoice.findUnique({
    where: { orderId },
    select: {
      id: true,
      invoiceNumber: true,
      paidAt: true,
      amountDue: true,
      amountPaid: true,
      total: true,
      status: true,
    },
  });

  const creatorUser = order.createdBy
    ? userMap.get(order.createdBy)
    : undefined;
  const updaterUser = order.updatedBy
    ? userMap.get(order.updatedBy)
    : undefined;

  return {
    placedByName: placedBy?.name ?? placedBy?.email ?? null,
    placedByEmail: placedBy?.email ?? null,
    placedByUserId: buyerUserId,
    placedByImage: placedBy?.image ?? null,
    orderProductOwners: productOwnerUsers.map((u) => ({
      userId: u.id,
      name: u.name ?? null,
      email: u.email,
      image: u.image ?? null,
    })),
    invoiceForOrder: invoiceForOrder
      ? {
          id: invoiceForOrder.id,
          invoiceNumber: invoiceForOrder.invoiceNumber,
          paidAt: invoiceForOrder.paidAt?.toISOString() ?? null,
          amountDue: invoiceForOrder.amountDue,
          amountPaid: invoiceForOrder.amountPaid,
          total: invoiceForOrder.total,
          status: invoiceForOrder.status,
        }
      : null,
    creator: toParty(creatorUser ?? null),
    updater: toParty(updaterUser ?? null),
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
  const detail = transformOrderDetail(order, enrichment);
  const items = await enrichOrderItemsCatalogNames(detail.items);
  return { ...detail, items };
}
