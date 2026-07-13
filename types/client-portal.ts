/**
 * Admin Client Portal type definitions
 * Dashboard for viewing client (role=client) users, their orders, invoices, activity
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
  total: number;
  clientId: string;
  clientName: string;
  createdAt: string;
}

export interface ClientPortalRecentInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  clientId: string;
  clientName: string;
  createdAt: string;
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
