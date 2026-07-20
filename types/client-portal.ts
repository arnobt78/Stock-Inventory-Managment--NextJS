/**
 * Admin Client Portal type definitions
 * Dashboard for viewing client (role=client) users, their orders, invoices, activity
 * REQ-0177 — denser recent order/invoice catalog meta
 */

export interface ClientPortalStats {
  counts: ClientPortalCounts;
  revenue: ClientPortalRevenue;
  recentOrders: ClientPortalRecentOrder[];
  recentInvoices: ClientPortalRecentInvoice[];
  clients: ClientPortalClient[];
}

export interface ClientPortalCounts {
  clients: number;
  orders: number;
  invoices: number;
}

export interface ClientPortalRevenue {
  orders: number;
  invoices: number;
}

export interface ClientPortalRecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total: number;
  clientId: string;
  clientName: string;
  /** REQ-0170 — client avatar on recent rows */
  clientImage?: string | null;
  createdAt: string;
  /** REQ-0128 — terminal status date for recent-order cards */
  statusAt?: string;
  /** REQ-0177 — first-line product/category/supplier (dashboard parity) */
  productId?: string | null;
  productPreview?: string | null;
  productImageUrl?: string | null;
  extraItemCount?: number;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierImage?: string | null;
}

export interface ClientPortalRecentInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  clientId: string;
  clientName: string;
  /** REQ-0170 — client avatar on recent rows */
  clientImage?: string | null;
  createdAt: string;
  /** REQ-0177 — product meta from linked order first item */
  productId?: string | null;
  productPreview?: string | null;
  productImageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
}

export interface ClientPortalClient {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string;
  orderCount: number;
  invoiceCount: number;
  totalSpent: number;
}
