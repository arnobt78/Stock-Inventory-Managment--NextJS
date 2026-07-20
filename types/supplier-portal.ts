/**
 * Admin Supplier Portal type definitions
 * Dashboard for viewing supplier (role=supplier) users, their products, orders, activity
 * REQ-0177 — denser recent product/order catalog meta
 * REQ-0178 — recent orders buyer (placedBy*) for date-row avatar
 */

export interface SupplierPortalStats {
  counts: SupplierPortalCounts;
  recentProducts: SupplierPortalRecentProduct[];
  recentOrders: SupplierPortalRecentOrder[];
  suppliers: SupplierPortalSupplier[];
}

export interface SupplierPortalCounts {
  suppliers: number;
  products: number;
  orders: number;
  totalValue: number;
}

export interface SupplierPortalRecentProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  status: string;
  supplierId: string;
  supplierName: string;
  /** REQ-0170 — product thumb + supplier avatar seed */
  imageUrl?: string | null;
  supplierUserId?: string | null;
  supplierImage?: string | null;
  /** REQ-0177 — category + reserved for denser meta row */
  categoryId?: string | null;
  categoryName?: string | null;
  reservedQuantity?: number;
  committedQuantity?: number;
  createdAt: string;
}

export interface SupplierPortalRecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total: number;
  supplierId: string;
  supplierName: string;
  /** REQ-0170 — supplier avatar on recent order rows */
  supplierUserId?: string | null;
  supplierImage?: string | null;
  createdAt: string;
  /** REQ-0128 — terminal status date for recent-order cards */
  statusAt?: string;
  /** REQ-0177 — first-line product meta (dashboard Recent Orders parity) */
  productId?: string | null;
  productPreview?: string | null;
  productImageUrl?: string | null;
  extraItemCount?: number;
  categoryId?: string | null;
  categoryName?: string | null;
  /** REQ-0178 — buyer for Calendar · date · AvatarInlineLink row */
  placedById?: string | null;
  placedByName?: string | null;
  placedByImage?: string | null;
}

export interface SupplierPortalSupplier {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string;
  productCount: number;
  orderCount: number;
  totalValue: number;
}
