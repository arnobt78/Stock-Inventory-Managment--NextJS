/**
 * REQ-0086 — shared product/order list shapes for category + supplier detail pages.
 */

export type CatalogDetailPartySnapshot = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
};

export type CatalogDetailProductItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  sku?: string | null;
  quantity?: number;
  reservedQuantity?: number;
  price?: number;
  status?: string;
  owner?: CatalogDetailPartySnapshot | null;
  supplier?: { id: string; name: string } | null;
};

export type CatalogDetailRecentOrderItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  productImageUrl?: string | null;
  quantity: number;
  price: number;
  orderDate: string;
  subtotal: number;
  proportionalAmount?: number;
  orderTotal?: number;
  orderStatus: string;
  owner?: CatalogDetailPartySnapshot | null;
  placedBy?: CatalogDetailPartySnapshot | null;
};
