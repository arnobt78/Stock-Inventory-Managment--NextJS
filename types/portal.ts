/**
 * Portal Types for Supplier and Client portals
 */

/**
 * Order status counts for portal dashboards
 */
export interface PortalOrderStatusCounts {
  /** Order status = pending (unpaid, awaiting) */
  pending: number;
  /** Order status = confirmed or processing (paid, not yet shipped) */
  inProgress: number;
  shipped: number;
  delivered: number;
  /** Paid/partial orders (not cancelled); in supplier "Pending Orders" card = completed */
  completed: number;
  cancelled: number;
  /** Orders with paymentStatus === 'refunded' */
  refunded?: number;
}

/** Product status counts for supplier (available, stock low ≤20, stock out) */
export interface SupplierProductStatusCounts {
  available: number;
  stockLow: number;
  stockOut: number;
}

/** Revenue by payment status (supplier's share) */
export interface SupplierRevenueBreakdown {
  paid: number;
  due: number;
  refund: number;
  pending: number;
}

/** Value breakdown for supplier Product Value card (orders/invoices/due/cancelled/refunded) */
export interface SupplierValueBreakdown {
  orders: number;
  invoices: number;
  due: number;
  cancelled: number;
  refunded: number;
}

/** Invoice counts for orders that contain supplier's products (created by product owner) */
export interface SupplierInvoiceBreakdown {
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
  refunded: number;
}

/**
 * Supplier Portal Dashboard Stats
 */
export interface SupplierPortalDashboard {
  supplierId: string;
  supplierName: string;
  totalProducts: number;
  /** Product status counts (threshold 20 for stock low, same as product owner) */
  productStatusCounts: SupplierProductStatusCounts;
  /** Sum of price × quantity for this supplier's products only */
  productValue: number;
  /** Value breakdown for Product Value card (supplier's share) */
  valueBreakdown: SupplierValueBreakdown;
  totalOrders: number;
  pendingOrders: number;
  orderStatusCounts: PortalOrderStatusCounts;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  /** Revenue by payment status (supplier share); excl. cancelled orders */
  revenueBreakdown: SupplierRevenueBreakdown;
  /** Invoices for orders containing supplier's products (created by product owner) */
  totalInvoices: number;
  invoiceBreakdown: SupplierInvoiceBreakdown;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus?: string;
    total: number;
    createdAt: string;
    productCount: number;
    /** REQ-0128 — terminal status date for recent-order cards */
    statusAt?: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    status: string;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

/**
 * Payment breakdown for client Total Spent card (order amounts by payment status)
 */
export interface ClientPaymentBreakdown {
  paid: number;
  due: number;
  refund: number;
  pending: number;
  cancelled: number;
}

/**
 * Invoice counts for client Outstanding / Invoices card
 */
export interface ClientInvoiceBreakdown {
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
  /** Count of orders with paymentStatus === 'refunded' (for Refunded badge) */
  refunded?: number;
  total: number;
}

/**
 * Client Portal Dashboard Stats
 */
export interface ClientPortalDashboard {
  clientId: string;
  clientName: string;
  totalOrders: number;
  /** Orders by fulfillment (pending, shipped, delivered) */
  orderStatusCounts: PortalOrderStatusCounts;
  /** Count of orders with paymentStatus === 'refunded' */
  refundedOrdersCount: number;
  /** Orders awaiting payment (unpaid, not cancelled) */
  ordersAwaitingPayment: number;
  /** Orders paid and not cancelled */
  ordersCompleted: number;
  /** @deprecated use ordersAwaitingPayment + orderStatusCounts for clarity */
  pendingOrders?: number;
  totalSpent: number;
  outstandingAmount: number;
  /** Sum of all invoice totals for this client (for cards) */
  totalInvoiceAmount: number;
  /** Order amounts by payment status for Total Spent card badges */
  paymentBreakdown: ClientPaymentBreakdown;
  /** Invoice counts by status for Outstanding card badges */
  invoiceBreakdown: ClientInvoiceBreakdown;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus?: string;
    total: number;
    createdAt: string;
    itemCount: number;
    /** REQ-0128 — terminal status date for recent-order cards */
    statusAt?: string;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    amountDue: number;
    dueDate: string | null;
  }>;
  monthlySpending: Array<{
    month: string;
    spent: number;
    orders: number;
  }>;
}

/**
 * Client catalog overview (read-only: suppliers, categories, products)
 */
export interface ClientCatalogOverview {
  meta: {
    totalSuppliers: number;
    totalCategories: number;
    totalProducts: number;
  };
  suppliers: Array<{
    id: string;
    name: string;
    status: string;
    productCount: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    status: string;
    productCount: number;
    categoryCreatorId: string;
    categoryCreatorName: string | null;
  }>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    categoryId: string;
    categoryName: string;
    supplierId: string;
    supplierName: string;
    price: number;
    status: string;
    productOwnerId: string;
    productOwnerName: string | null;
    productOwnerImage?: string | null;
  }>;
}

/**
 * Client browse meta (product owners + global stats for client browse page)
 */
export interface ClientBrowseMeta {
  admins: Array<{ id: string; name: string; email: string; image?: string | null }>;
  stats: {
    storeOwners: {
      total: number;
      withProducts: number;
    };
    admins: number;
    clients: number;
    suppliers: { total: number; active: number; inactive: number };
    categories: { total: number; active: number; inactive: number };
    warehouses: { total: number; active: number; inactive: number };
  };
}

/**
 * Client browse products response
 */
export interface ClientBrowseProductsResponse {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    reservedQuantity: number;
    status: string;
    categoryId: string;
    supplierId: string;
    category: string;
    supplier: string;
    userId: string;
    createdBy: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string | null;
    qrCodeUrl: string | null;
    imageUrl: string | null;
    imageFileId: string | null;
    expirationDate: string | null;
  }>;
  categories: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
  /** Product owner info (when client browses by ownerId); used for empty-state messaging */
  owner?: { id: string; name: string; email: string };
}

/**
 * Portal User Info
 */
export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: "supplier" | "client";
  linkedEntityId?: string; // Supplier ID or Client (User) ID
}
