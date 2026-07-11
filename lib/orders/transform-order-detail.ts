/**
 * Shared order detail response transform — used by API GET and SSR prefetch.
 * REQ-0024: single source of truth for order detail JSON shape.
 */

import type { Order } from "@/types";
import {
  mapOrderItemsFromRaw,
  type OrderItemRaw,
} from "@/lib/orders/map-order-items";

type OrderRaw = {
  id: string;
  orderNumber: string;
  userId: string;
  clientId: string | null;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number | null;
  shipping: number | null;
  discount: number | null;
  total: number;
  shippingAddress: unknown;
  billingAddress: unknown;
  notes: string | null;
  trackingNumber: string | null;
  trackingCarrier?: string | null;
  trackingUrl: string | null;
  labelUrl?: string | null;
  estimatedDelivery?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  stripePaymentIntentId?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  items?: OrderItemRaw[];
};

export type OrderDetailEnrichment = {
  placedByName: string | null;
  placedByEmail: string | null;
  orderProductOwners: { userId: string; name: string | null; email: string }[];
  invoiceForOrder: { id: string; invoiceNumber: string } | null;
};

/** Map Prisma order + enrichment to API/SSR Order shape. */
export function transformOrderDetail(
  order: OrderRaw,
  enrichment: OrderDetailEnrichment,
): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    clientId: order.clientId,
    status: order.status as Order["status"],
    paymentStatus: order.paymentStatus as Order["paymentStatus"],
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    notes: order.notes,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier ?? null,
    trackingUrl: order.trackingUrl,
    labelUrl: order.labelUrl ?? null,
    estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
    shippedAt: order.shippedAt?.toISOString() || null,
    deliveredAt: order.deliveredAt?.toISOString() || null,
    cancelledAt: order.cancelledAt?.toISOString() || null,
    stripePaymentIntentId: order.stripePaymentIntentId ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString() || null,
    createdBy: order.createdBy,
    updatedBy: order.updatedBy,
    placedByName: enrichment.placedByName,
    placedByEmail: enrichment.placedByEmail,
    orderProductOwners: enrichment.orderProductOwners,
    invoiceForOrder: enrichment.invoiceForOrder,
    items: mapOrderItemsFromRaw(order.items),
  } as unknown as Order;
}
