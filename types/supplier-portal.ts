/**
 * Admin Supplier Portal type definitions
 * Dashboard for viewing supplier (role=supplier) users, their products, orders, activity
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
  createdAt: string;
}

export interface SupplierPortalRecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  /** REQ-0128 — terminal status date for recent-order cards */
  statusAt?: string;
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
