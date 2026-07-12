/**
 * Category-related type definitions
 */

/** Party snapshot for category detail rows (owner, buyer, supplier). */
export type CategoryPartySnapshot = import("@/types/catalog-detail-lists").CatalogDetailPartySnapshot;

export type CategoryProductSummary = import("@/types/catalog-detail-lists").CatalogDetailProductItem;

export type CategoryRecentOrder = import("@/types/catalog-detail-lists").CatalogDetailRecentOrderItem;

import type {
  CatalogEntityInsights,
  CatalogSalesTrendPoint,
  CatalogStockBreakdown,
} from "@/types/catalog-insights";

/** @deprecated Use CatalogSalesTrendPoint from catalog-insights. */
export type CategorySalesTrendPoint = CatalogSalesTrendPoint;

/** @deprecated Use CatalogStockBreakdown from catalog-insights. */
export type CategoryStockBreakdown = CatalogStockBreakdown;

/** @deprecated Use CatalogEntityInsights from catalog-insights. */
export type CategoryInsights = CatalogEntityInsights;

export type CategoryForecastUrgentRow = {
  productId: string;
  productName: string;
  sku: string;
  availableStock: number;
  daysUntilStockout: number | null;
  reorderRecommendation: "urgent" | "soon" | "normal" | "overstocked";
};

export type CategoryForecastRollup = {
  urgentReorderCount: number;
  soonReorderCount: number;
  predictedDailyDemand: number;
  topUrgent: CategoryForecastUrgentRow[];
};

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
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  createdBy: string; // User ID who created the category
  updatedBy?: string | null; // User ID who last updated the category
  /** Extended by API for detail page */
  creator?: CategoryPartySnapshot | null;
  updater?: CategoryPartySnapshot | null;
  products?: CategoryProductSummary[] | null;
  statistics?: {
    totalProducts: number;
    totalQuantitySold: number;
    totalRevenue: number;
    uniqueOrders: number;
    totalValue: number;
  } | null;
  recentOrders?: CategoryRecentOrder[] | null;
  /** REQ-0081 — derived KPIs from products + order history (SSR). */
  categoryInsights?: CategoryInsights | null;
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
