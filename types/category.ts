/**
 * Category-related type definitions
 */

/**
 * Category interface matching Prisma schema
 */
export interface Category {
  id: string;
  name: string;
  userId: string; // Created by user ID
  status: boolean; // Active/Inactive status (default: true)
  description?: string | null; // Optional description field
  notes?: string | null; // Optional notes field
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy: string; // User ID who created the category
  updatedBy?: string | null; // User ID who last updated the category
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
  products?: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    sku?: string | null;
    quantity?: number;
    price?: number;
  }> | null;
  statistics?: {
    totalProducts: number;
    totalQuantitySold: number;
    totalRevenue: number;
    uniqueOrders: number;
    totalValue: number;
  } | null;
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
 * Category creation input
 */
export interface CreateCategoryInput {
  name: string;
  userId: string;
  status?: boolean; // Optional, defaults to true
  description?: string | null; // Optional description
  notes?: string | null; // Optional notes
}

/**
 * Category update input
 */
export interface UpdateCategoryInput {
  id: string;
  name: string;
  status?: boolean; // Optional status update
  description?: string | null; // Optional description update
  notes?: string | null; // Optional notes update
}

