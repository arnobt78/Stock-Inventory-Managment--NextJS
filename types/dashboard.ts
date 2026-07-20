/**
 * Dashboard (admin overview) type definitions
 * Used by GET /api/dashboard and admin Analytics page.
 */

export interface DashboardCounts {
  products: number;
  users: number;
  suppliers: number;
  categories: number;
  orders: number;
  invoices: number;
  warehouses: number;
  tickets: number;
  reviews: number;
}

export interface DashboardRevenue {
  fromOrders: number;
  fromInvoices: number;
}

export interface DashboardTrendPoint {
  month: string;
  label: string;
  orders: number;
  revenue: number;
  products: number;
  invoices: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  /** REQ-0128 — terminal status date for recent-order cards */
  statusAt?: string;
  /** REQ-0168 / REQ-0170 — buyer display + avatar link */
  placedById?: string | null;
  placedByName?: string | null;
  placedByEmail?: string | null;
  placedByImage?: string | null;
  /** First line product (+ optional "+N" via extraItemCount) */
  productId?: string | null;
  productPreview?: string | null;
  productImageUrl?: string | null;
  extraItemCount?: number;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  /** REQ-0174 — User.image via Supplier.userId for AvatarInlineLink */
  supplierImage?: string | null;
}

export interface DashboardRecentTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  /** REQ-0170 — ticket creator */
  userId?: string | null;
  userName?: string | null;
  userImage?: string | null;
}

export interface DashboardRecentReview {
  id: string;
  productName: string;
  rating: number;
  status: string;
  createdAt: string;
  /** REQ-0170 — reviewer + product thumb */
  userId?: string | null;
  userName?: string | null;
  userImage?: string | null;
  productId?: string | null;
  productImageUrl?: string | null;
  /** REQ-0174 — category beside rating★ */
  categoryId?: string | null;
  categoryName?: string | null;
}

export interface DashboardRecentImport {
  id: string;
  importType: string;
  fileName: string;
  status: string;
  successRows: number;
  failedRows: number;
  createdAt: string;
  /** REQ-0170 — importer */
  userId?: string | null;
  userName?: string | null;
  userImage?: string | null;
}

export interface DashboardRecent {
  orders: DashboardRecentOrder[];
  tickets: DashboardRecentTicket[];
  reviews: DashboardRecentReview[];
  imports: DashboardRecentImport[];
}

/**
 * Order status distribution
 */
export interface DashboardOrderStatusDist {
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

/**
 * Top product by order count
 * REQ-0173 — denser Product cell meta (image, category, supplier)
 */
export interface DashboardTopProduct {
  productId: string;
  productName: string;
  sku: string | null;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  /** Linked User.image via Supplier.userId */
  supplierImage?: string | null;
}

/**
 * Order analytics summary
 */
export interface DashboardOrderAnalytics {
  statusDistribution: DashboardOrderStatusDist;
  topProducts: DashboardTopProduct[];
  averageOrderValue: number;
  totalRevenue: number;
  /** Sum of order totals excluding cancelled orders (store-wide). Use for Total Revenue card. */
  totalRevenueExcludingCancelled: number;
  /**
   * REQ-0154 — Σ amountDue where amountPaid≈0 on draft/sent invoices (fully unpaid outstanding).
   * Not order.total for paymentStatus partial.
   */
  pendingOrderAmount: number;
  /**
   * REQ-0154 — Σ amountPaid on fully settled invoices (status paid or amountDue≈0).
   */
  paidOrderAmount: number;
  /**
   * REQ-0154 — Σ amountPaid on mid-pay invoices (amountPaid>0 && amountDue>0).
   */
  partialOrderAmount: number;
  /** Sum of order totals where paymentStatus === 'refunded' (store-wide) */
  refundedAmount: number;
  /** Count of orders where paymentStatus === 'refunded' (store-wide) */
  refundedCount: number;
  /** Sum of order totals for cancelled orders (store-wide). Excluded from Total Revenue; show on Total Value card. */
  cancelledOrderAmount: number;
}

/**
 * Invoice status distribution
 */
export interface DashboardInvoiceStatusDist {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

/**
 * Invoice analytics summary
 */
export interface DashboardInvoiceAnalytics {
  statusDistribution: DashboardInvoiceStatusDist;
  totalRevenue: number;
  /** Sum of invoice totals excluding cancelled (store-wide) */
  totalExcludingCancelled?: number;
  /** Sum of cancelled invoice totals (store-wide) */
  cancelledInvoiceSum?: number;
  /** REQ-0154 — Σ amountPaid on fully settled invoices (aligned with paidOrderAmount). */
  paidRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  /** Average invoice total excluding cancelled (totalExcludingCancelled / non-cancelled count) */
  averageInvoiceValueExcludingCancelled?: number;
  /**
   * REQ-0154 — Count of mid-pay invoices (sent/overdue ∧ amountPaid>0 ∧ amountDue>0).
   * Not a DB status — derived from amount fields.
   */
  partialCount?: number;
  /**
   * REQ-0154 — Count of draft/sent invoices with amountPaid≈0 (fully unpaid).
   * Prefer over draft+sent statusDistribution for Pending badge.
   */
  pendingCount?: number;
}

/**
 * Warehouse analytics summary
 */
export interface DashboardWarehouseAnalytics {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  typeDistribution: { type: string; count: number }[];
}

/** Product status counts (store owner's products) */
export interface DashboardProductStatusBreakdown {
  available: number;
  stockLow: number;
  stockOut: number;
}

/** User role counts (all users) */
export interface DashboardUserRoleBreakdown {
  admin: number;
  client: number;
  supplier: number;
}

/** Supplier status counts (store owner's suppliers) */
export interface DashboardSupplierStatusBreakdown {
  active: number;
  inactive: number;
}

/** Category status counts (store owner's categories) */
export interface DashboardCategoryStatusBreakdown {
  active: number;
  inactive: number;
}

/** Support ticket status counts (tickets assigned to this admin) */
export interface DashboardTicketStatusBreakdown {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

/** Product review status counts (reviews for owner's products) */
export interface DashboardReviewStatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
}

/** Self vs others (store owner vs client) breakdown for homepage cards */
export interface DashboardSelfOthersBreakdown {
  /** Orders placed by store owner */
  orderSelfCount: number;
  /** Orders placed by clients (others) */
  orderOthersCount: number;
  /** Invoices for orders placed by store owner */
  invoiceSelfCount: number;
  /** Invoices for orders placed by clients (others) */
  invoiceOthersCount: number;
  /** Revenue from orders placed by store owner (excl. cancelled) */
  revenueSelf: number;
  /** Revenue from orders placed by clients (excl. cancelled) */
  revenueOthers: number;
}

export interface DashboardStats {
  counts: DashboardCounts;
  revenue: DashboardRevenue;
  trends: DashboardTrendPoint[];
  recent: DashboardRecent;
  orderAnalytics: DashboardOrderAnalytics;
  invoiceAnalytics: DashboardInvoiceAnalytics;
  warehouseAnalytics: DashboardWarehouseAnalytics;
  /** Total inventory value (sum of price*quantity for owner's products) */
  totalInventoryValue?: number;
  productStatusBreakdown?: DashboardProductStatusBreakdown;
  userRoleBreakdown?: DashboardUserRoleBreakdown;
  supplierStatusBreakdown?: DashboardSupplierStatusBreakdown;
  categoryStatusBreakdown?: DashboardCategoryStatusBreakdown;
  ticketStatusBreakdown?: DashboardTicketStatusBreakdown;
  reviewStatusBreakdown?: DashboardReviewStatusBreakdown;
  /** Self vs others breakdown (orders, invoices, revenue) for homepage cards */
  selfOthersBreakdown?: DashboardSelfOthersBreakdown;
}
