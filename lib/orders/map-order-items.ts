/**
 * REQ-0063 — shared Prisma order-item → API OrderItem mapper.
 * Used by order detail transform and invoice detail enrichment (linked order line items).
 */

import type { OrderItem } from "@/types";

/** Raw order line item shape from Prisma include (order detail + invoice enrichment). */
export type OrderItemRaw = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: Date;
  warehouseId?: string | null;
  warehouseName?: string | null;
  product?: {
    categoryId?: string | null;
    supplierId?: string | null;
    imageUrl?: string | null;
    userId?: string | null;
  } | null;
};

/** Map Prisma order items to the shared OrderItem JSON shape (incl. REQ-0059 imageUrl). */
export function mapOrderItemsFromRaw(items: OrderItemRaw[] | undefined): OrderItem[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    createdAt: item.createdAt.toISOString(),
    warehouseId: item.warehouseId ?? null,
    warehouseName: item.warehouseName ?? null,
    categoryId: item.product?.categoryId ?? null,
    supplierId: item.product?.supplierId ?? null,
    imageUrl: item.product?.imageUrl ?? null,
  }));
}
