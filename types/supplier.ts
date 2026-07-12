/**
 * Supplier-related type definitions
 */

/**
 * Supplier interface matching Prisma schema
 */
export interface Supplier {
  id: string;
  name: string;
  userId: string; // Created by user ID
  status: boolean; // Active/Inactive status (default: true)
  description?: string | null; // Optional description field
  notes?: string | null; // Optional notes field
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy: string; // User ID who created the supplier
  updatedBy?: string | null; // User ID who last updated the supplier
  /** True when this is the global Demo Supplier (test@supplier.com); edit/duplicate/delete are disabled. */
  isGlobalDemo?: boolean;
  /** Extended by API for detail page */
  creator?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  updater?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  statistics?: {
    totalProducts: number;
    totalQuantitySold: number;
    totalRevenue: number;
    uniqueOrders: number;
    totalValue: number;
  } | null;
  products?: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    sku?: string | null;
    quantity?: number;
    price?: number;
  }> | null;
  recentOrders?: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    productName: string;
    productSku?: string | null;
    quantity: number;
    price: number;
    orderDate: string;
    subtotal: number;
    /** Proportional share of order total (includes tax, shipping, discount) */
    proportionalAmount?: number;
    orderTotal?: number;
    orderStatus: string;
  }> | null;
}

/**
 * Supplier creation input
 */
export interface CreateSupplierInput {
  name: string;
  userId: string;
  status?: boolean; // Optional, defaults to true
  description?: string | null; // Optional description
  notes?: string | null; // Optional notes
}

/**
 * Supplier update input
 */
export interface UpdateSupplierInput {
  id: string;
  name: string;
  status?: boolean; // Optional status update
  description?: string | null; // Optional description update
  notes?: string | null; // Optional notes update
}

