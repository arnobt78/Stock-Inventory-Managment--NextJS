/**
 * REQ-0191 — Bounded related product/order/supplier enrich for ticket detail.
 * Pure merge helper (testable) + async Prisma load used by SSR/API transform path.
 */

import { prisma } from "@/prisma/client";
import type { SupportTicket } from "@/types";

export type TicketRelatedSnap = {
  relatedProductName?: string | null;
  relatedProductSku?: string | null;
  relatedOrderNumber?: string | null;
  relatedOrderStatus?: string | null;
  relatedOrderPaymentStatus?: string | null;
  relatedSupplierName?: string | null;
};

export function mergeTicketRelated(
  ticket: SupportTicket,
  related: TicketRelatedSnap,
): SupportTicket {
  return { ...ticket, ...related };
}

/** Load related names when ticket has productId / orderId / supplierId. */
export async function loadTicketRelatedSnap(ticket: {
  productId: string | null;
  orderId: string | null;
  supplierId: string | null;
}): Promise<TicketRelatedSnap> {
  if (!ticket.productId && !ticket.orderId && !ticket.supplierId) {
    return {};
  }

  const [product, order, supplier] = await Promise.all([
    ticket.productId
      ? prisma.product.findUnique({
          where: { id: ticket.productId },
          select: { name: true, sku: true },
        })
      : null,
    ticket.orderId
      ? prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: {
            orderNumber: true,
            status: true,
            paymentStatus: true,
          },
        })
      : null,
    ticket.supplierId
      ? prisma.supplier.findUnique({
          where: { id: ticket.supplierId },
          select: { name: true },
        })
      : null,
  ]);

  return {
    relatedProductName: product?.name ?? null,
    relatedProductSku: product?.sku ?? null,
    relatedOrderNumber: order?.orderNumber ?? null,
    relatedOrderStatus: order?.status ?? null,
    relatedOrderPaymentStatus: order?.paymentStatus ?? null,
    relatedSupplierName: supplier?.name ?? null,
  };
}
