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
  /** REQ-0103 — display-only list enrichment */
  committedQuantity?: number;
  price?: number;
  status?: string;
  owner?: CatalogDetailPartySnapshot | null;
  supplier?: { id: string; name: string } | null;
  /** REQ-0141 — category link on product grid (supplier detail + category parity). */
  category?: { id: string; name: string } | null;
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
  /** REQ-0131 — paid/refunded statusAt hue on recent-order cards */
  paymentStatus?: string;
  /** REQ-0127 — terminal status date for recent-order cards */
  statusAt?: string;
  owner?: CatalogDetailPartySnapshot | null;
  placedBy?: CatalogDetailPartySnapshot | null;
  /** REQ-0143 — category link between SKU and Qty */
  category?: { id: string; name: string } | null;
  /** REQ-0143 — linked invoice indicator beside order number */
  invoiceForOrder?: { id: string; invoiceNumber: string } | null;
};
