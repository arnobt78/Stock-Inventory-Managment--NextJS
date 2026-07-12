/**
 * Product-related type definitions
 */

import type { CatalogEntityInsights } from "@/types/catalog-insights";

/**
 * Product status types
 */
export type ProductStatus = "Available" | "Stock Low" | "Stock Out";

/**
 * Product interface matching Prisma schema
 */
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  reservedQuantity?: number; // Stock reserved by pending orders (not yet confirmed)
  status?: ProductStatus;
  createdAt: Date;
  updatedAt?: Date | null;
  userId: string;
  createdBy: string; // User ID who created the product
  updatedBy?: string | null; // User ID who last updated the product
  categoryId: string;
  supplierId: string;
  category?: string | { id: string; name: string } | null;
  supplier?: string | { id: string; name: string } | null;
  qrCodeUrl?: string; // ImageKit URL for QR code image
  qrCodeFileId?: string; // ImageKit file ID for cleanup when regenerating
  imageUrl?: string; // ImageKit URL for product image
  imageFileId?: string; // ImageKit file ID for cleanup when updating/deleting
  expirationDate?: Date | null; // Product expiration date (optional, for perishable items)
  /** Set when product is archived (soft-deleted) due to order history */
  deletedAt?: Date | null;
  deletedBy?: string | null;
  /** Product owner display name (populated when fetching by supplier) */
  productOwnerName?: string | null;
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
    totalQuantitySold: number;
    totalRevenue: number;
    uniqueOrders: number;
    totalValue?: number;
  } | null;
  recentOrders?: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    productName?: string;
    productSku?: string | null;
    quantity: number;
    price: number;
    orderDate: string;
    subtotal: number;
    /** Proportional share of order total (includes tax, shipping, discount) */
    proportionalAmount?: number;
    orderTotal?: number;
    orderStatus: string;
    placedBy?: {
      id: string;
      name: string | null;
      email: string;
      image?: string | null;
    } | null;
  }> | null;
  /** REQ-0084 — derived KPIs + sales trend from order history (SSR). */
  productInsights?: CatalogEntityInsights | null;
}

/**
 * Product creation input (without generated fields)
 */
export interface CreateProductInput {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  status: ProductStatus;
  categoryId: string;
  supplierId: string;
  userId: string;
  imageUrl?: string;
  imageFileId?: string;
  expirationDate?: string; // ISO date string
}

/**
 * Product update input (all fields optional except id)
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  status?: ProductStatus;
  categoryId?: string;
  supplierId?: string;
  imageUrl?: string;
  imageFileId?: string;
  expirationDate?: string | null; // ISO date string or null to clear
}
