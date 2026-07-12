/**
 * Category-related type definitions
 */

/** Party snapshot for category detail rows (owner, buyer, supplier). */
export type CategoryPartySnapshot = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
};

export type CategoryProductSummary = {
  id: string;
  name: string;
  imageUrl?: string | null;
  sku?: string | null;
  quantity?: number;
  reservedQuantity?: number;
  price?: number;
  status?: string;
  owner?: CategoryPartySnapshot | null;
  supplier?: { id: string; name: string } | null;
};

export type CategoryRecentOrder = {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  productImageUrl?: string | null;
  quantity: number;
  price: number;
  orderDate: string;
  subtotal: number;
  proportionalAmount?: number;
  orderTotal?: number;
  orderStatus: string;
  owner?: CategoryPartySnapshot | null;
  placedBy?: CategoryPartySnapshot | null;
};

export type CategorySalesTrendPoint = {
  month: string;
  revenue: number;
  units: number;
};

export type CategoryStockBreakdown = {
  available: number;
  low: number;
  out: number;
};

export type CategoryInsights = {
  lowStockCount: number;
  outOfStockCount: number;
  avgOrderValue: number;
  demandVelocity: number;
  salesTrend: CategorySalesTrendPoint[];
  stockBreakdown: CategoryStockBreakdown;
};

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
  /** REQ-0081 — derived KPIs from products + order history */
  categoryInsights?: CategoryInsights | null;
  /** REQ-0081 — admin-only forecast rollup for category products */
  categoryForecast?: CategoryForecastRollup | null;
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
