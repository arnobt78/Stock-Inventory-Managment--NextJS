/**
 * REQ-0150 — batch-load linked order preview for invoice list rows (SSR + API).
 * REQ-0151 — also linked order status / paymentStatus / statusAt / paidAt.
 * Server-only — uses Prisma.
 */

import { prisma } from "@/prisma/client";
import { resolveInvoiceStatusAt } from "@/lib/invoices/invoice-status-display-date";
import { resolveOrderStatusAt } from "@/lib/orders/order-status-display-date";
import type { OrderItem } from "@/types";

export type InvoiceListOrderPreview = {
  linkedOrderNumber: string | null;
  linkedOrderCreatedAt: string | null;
  linkedOrderItems: OrderItem[];
  /** REQ-0151 — order status for Invoice table Order # badges */
  linkedOrderStatus?: string | null;
  linkedOrderPaymentStatus?: string | null;
  linkedOrderStatusAt?: string | null;
  linkedOrderPaidAt?: string | null;
  statusAt?: string;
};

type InvoiceRowForEnrich = {
  orderId: string;
  status: string;
  createdAt: string | Date;
  issuedAt: string | Date;
  dueDate: string | Date;
  sentAt?: string | Date | null;
  paidAt?: string | Date | null;
  cancelledAt?: string | Date | null;
};

type OrderPreviewRow = {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  statusAt?: string;
  paidAt?: string | null;
  items: OrderItem[];
};

/**
 * Fetch order number / status / payment / line items for many invoices in one query.
 */
export async function fetchInvoiceListOrderPreviewMap(
  orderIds: string[],
): Promise<Map<string, OrderPreviewRow>> {
  const unique = [...new Set(orderIds.filter(Boolean))];
  const map = new Map<string, OrderPreviewRow>();
  if (unique.length === 0) return map;

  const orders = await prisma.order.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      cancelledAt: true,
      deliveredAt: true,
      shippedAt: true,
      updatedAt: true,
      invoice: { select: { paidAt: true } },
      items: {
        select: {
          id: true,
          orderId: true,
          productId: true,
          productName: true,
          quantity: true,
          price: true,
          subtotal: true,
          createdAt: true,
          sku: true,
        },
      },
    },
  });

  for (const order of orders) {
    const paidAtIso = order.invoice?.paidAt?.toISOString() ?? null;
    const statusAt = resolveOrderStatusAt({
      status: order.status,
      paymentStatus: order.paymentStatus,
      paidAt: paidAtIso,
      cancelledAt: order.cancelledAt,
      deliveredAt: order.deliveredAt,
      shippedAt: order.shippedAt,
      updatedAt: order.updatedAt,
    });
    map.set(order.id, {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      statusAt,
      paidAt: paidAtIso,
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        createdAt: item.createdAt.toISOString(),
        sku: item.sku ?? null,
      })),
    });
  }
  return map;
}

/** Attach linked order preview + invoice statusAt onto a list invoice row. */
export function attachInvoiceListOrderPreview<T extends InvoiceRowForEnrich>(
  invoice: T,
  orderMap: Awaited<ReturnType<typeof fetchInvoiceListOrderPreviewMap>>,
): T & InvoiceListOrderPreview {
  const order = orderMap.get(invoice.orderId);
  const statusAt = resolveInvoiceStatusAt(invoice);
  return {
    ...invoice,
    linkedOrderNumber: order?.orderNumber ?? null,
    linkedOrderCreatedAt: order?.createdAt ?? null,
    linkedOrderItems: order?.items ?? [],
    linkedOrderStatus: order?.status ?? null,
    linkedOrderPaymentStatus: order?.paymentStatus ?? null,
    linkedOrderStatusAt: order?.statusAt ?? null,
    linkedOrderPaidAt: order?.paidAt ?? null,
    ...(statusAt ? { statusAt } : {}),
  };
}
