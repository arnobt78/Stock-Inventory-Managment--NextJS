/**
 * Supplier-related type definitions
 */

import type { CatalogEntityInsights } from "@/types/catalog-insights";
import type {
  CatalogDetailProductItem,
  CatalogDetailRecentOrderItem,
} from "@/types/catalog-detail-lists";

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
  /** REQ-0141 — linked User.email when Supplier.userId resolves (list). */
  email?: string | null;
  /** REQ-0141 — active products under this supplier (list + SSR). */
  productCount?: number;
  /** REQ-0141 — role-visible catalog size for Products % column. */
  catalogProductTotal?: number;
  /** True when this is the global Test Supplier (test@supplier.com); edit/duplicate/delete are disabled. */
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
  products?: CatalogDetailProductItem[] | null;
  recentOrders?: CatalogDetailRecentOrderItem[] | null;
  /** REQ-0084 — derived KPIs + sales trend from supplier products (SSR). */
  supplierInsights?: CatalogEntityInsights | null;
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

