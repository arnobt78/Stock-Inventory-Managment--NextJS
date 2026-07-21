/**
 * REQ-0191 — Bounded related product/order/supplier enrich for ticket detail.
 * REQ-0201 — Related product densify (image, price, stock, category, owner, supplier).
 * Pure merge helper (testable) + async Prisma load used by SSR/API transform path.
 */

import { prisma } from "@/prisma/client";
import {
  loadProductListPartyMaps,
  productListPartyFields,
} from "@/lib/server/product-list-party";
import type { SupportTicket } from "@/types";

export type TicketRelatedSnap = {
  relatedProductName?: string | null;
  relatedProductSku?: string | null;
  /** REQ-0201 densify */
  relatedProductImageUrl?: string | null;
  relatedProductPrice?: number | null;
  relatedProductQuantity?: number | null;
  relatedProductCategoryName?: string | null;
  relatedProductOwnerId?: string | null;
  relatedProductOwnerName?: string | null;
  relatedProductOwnerImage?: string | null;
  relatedProductSupplierId?: string | null;
  relatedProductSupplierName?: string | null;
  relatedProductSupplierImage?: string | null;
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
          select: {
            name: true,
            sku: true,
            imageUrl: true,
            price: true,
            quantity: true,
            userId: true,
            categoryId: true,
            supplierId: true,
          },
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

  let productDensify: TicketRelatedSnap = {
    relatedProductName: product?.name ?? null,
    relatedProductSku: product?.sku ?? null,
  };

  if (product) {
    const partyMaps = await loadProductListPartyMaps([product]);
    const party = productListPartyFields(product, partyMaps);
    productDensify = {
      relatedProductName: product.name,
      relatedProductSku: product.sku,
      relatedProductImageUrl: product.imageUrl ?? null,
      relatedProductPrice: Number(product.price),
      relatedProductQuantity: Number(product.quantity),
      relatedProductCategoryName: party.category,
      relatedProductOwnerId: product.userId,
      relatedProductOwnerName: party.productOwnerName,
      relatedProductOwnerImage: party.productOwnerImage,
      relatedProductSupplierId: product.supplierId,
      relatedProductSupplierName: party.supplier,
      relatedProductSupplierImage: party.supplierImage,
    };
  }

  return {
    ...productDensify,
    relatedOrderNumber: order?.orderNumber ?? null,
    relatedOrderStatus: order?.status ?? null,
    relatedOrderPaymentStatus: order?.paymentStatus ?? null,
    relatedSupplierName: supplier?.name ?? null,
  };
}
