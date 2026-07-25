/**
 * Order-related type definitions
 */

/**
 * Order status types
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Payment status types
 */
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial";

/**
 * Shipping address interface
 */
export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

/**
 * Billing address interface
 */
export interface BillingAddress {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

/**
 * Order item interface
 * Represents a single item in an order
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  /** ISO string from API/SSR transforms (REQ-0064) */
  createdAt: string;
  /** Category ID for link to category detail (from product) */
  categoryId?: string | null;
  /** Supplier ID for link to supplier detail (from product) */
  supplierId?: string | null;
  /** Display name from product.category (REQ-0071) */
  categoryName?: string | null;
  /** Display name from product.supplier (REQ-0071) */
  supplierName?: string | null;
  /** REQ-0068 — source warehouse when product has allocations */
  warehouseId?: string | null;
  warehouseName?: string | null;
  /** Current product image for line-item thumbnails (REQ-0059; null when product deleted) */
  imageUrl?: string | null;
  /** REQ-0114 — line share of order.total when fees/discount apply */
  proportionalAmount?: number;
}

/**
 * Order interface
 * Matches Prisma Order model
 */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string; // User who created the order (admin/warehouse user)
  clientId?: string | null; // Client who placed the order (optional)
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax?: number | null;
  shipping?: number | null;
  discount?: number | null;
  total: number;
  shippingAddress?: ShippingAddress | null;
  billingAddress?: BillingAddress | null;
  notes?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  /** ISO string from API/TanStack cache, or Date from Prisma-shaped payloads */
  estimatedDelivery?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  /** Stripe PaymentIntent ID when paid via Stripe (REQ-0071 detail card) */
  stripePaymentIntentId?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  createdBy: string;
  updatedBy?: string | null;
  items: OrderItem[]; // Order items (populated via relation)
  /** Placer name/email when shipping has none (e.g. from User who placed order) */
  placedByName?: string | null;
  /** Placer email from User (for detail page when shipping has no email) */
  placedByEmail?: string | null;
  /** Product owner name (for client view — who owns the products) */
  productOwnerName?: string | null;
  /** Product owner email (for client view) */
  productOwnerEmail?: string | null;
  /** Product owner(s) for items in this order (for Parties section) */
  orderProductOwners?: { userId: string; name: string | null; email: string; image?: string | null }[];
  /** REQ-0074 — party avatar SSR */
  placedByUserId?: string | null;
  placedByImage?: string | null;
  /** Linked invoice when order has an invoice (REQ-0061 actions; REQ-0145 list Invoice #) */
  invoiceForOrder?: {
    id: string;
    invoiceNumber: string;
    paidAt?: string | null;
    createdAt?: string;
    dueDate?: string;
    amountDue?: number;
    /** REQ-0152 */
    amountPaid?: number;
    total?: number;
    status?: string;
    sentAt?: string | null;
    cancelledAt?: string | null;
    updatedAt?: string | null;
  } | null;
  /** REQ-0129 — terminal status timestamp for list rows */
  statusAt?: string;
  /** REQ-0073 — payment timestamp from linked invoice (not order.updatedAt) */
  paidAt?: string | null;
  /** REQ-0096 — audit user snapshots for Created by / Updated by rows */
  creator?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  } | null;
  updater?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  } | null;
}

/**
 * Create order input
 * Used when creating a new order
 */
export interface CreateOrderInput {
  clientId?: string; // Optional client ID (for future client portal)
  items: Array<{
    productId: string;
    quantity: number;
    /** REQ-0068 — required server-side when product has warehouse allocations */
    warehouseId?: string;
  }>;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  tax?: number;
  shipping?: number;
  discount?: number;
  notes?: string;
}

/**
 * Update order input
 * Used when updating an existing order
 */
export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  trackingNumber?: string;
  /** REQ-0146 — carrier for manual / Shippo tracking */
  trackingCarrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
}

/**
 * Order filters
 * Used for filtering orders in list view
 */
export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  userId?: string;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search by order number, client name, etc.
}
