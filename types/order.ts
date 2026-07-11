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
  /** Current product image for line-item thumbnails (REQ-0059; null when product deleted) */
  imageUrl?: string | null;
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
  estimatedDelivery?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
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
  orderProductOwners?: { userId: string; name: string | null; email: string }[];
  /** Linked invoice when order has an invoice (for admin detail link) */
  invoiceForOrder?: { id: string; invoiceNumber: string } | null;
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
