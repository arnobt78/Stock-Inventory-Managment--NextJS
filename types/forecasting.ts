/**
 * Demand Forecasting & Predictive Analytics Types
 */

/**
 * Historical sales data point for a product
 */
export interface ProductSalesHistory {
  productId: string;
  productName: string;
  sku: string;
  dailySales: { date: string; quantity: number }[];
  totalSold: number;
  averageDailySales: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
}

/**
 * Demand forecast for a product
 */
export interface ProductDemandForecast {
  productId: string;
  productName: string;
  sku: string;
  /** REQ-0170 — optional thumb for admin forecast tables */
  imageUrl?: string | null;
  /** REQ-0171 — denser Product column (admin forecast tables) */
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  /** Linked User.image via Supplier.userId (square thumb, not avatar) */
  supplierImage?: string | null;
  currentStock: number;
  availableStock: number;
  averageDailySales: number;
  predictedDailySales: number; // Using trend analysis
  daysUntilStockout: number | null; // null if no sales or infinite
  reorderRecommendation: "urgent" | "soon" | "normal" | "overstocked";
  suggestedReorderQuantity: number;
  confidenceScore: number; // 0-100
}

/**
 * Anomaly detection result
 */
export interface SalesAnomaly {
  productId: string;
  productName: string;
  sku: string;
  /** REQ-0170 — optional thumb for admin forecast tables */
  imageUrl?: string | null;
  /** REQ-0171 — denser Product column (admin forecast tables) */
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierImage?: string | null;
  date: string;
  actualQuantity: number;
  expectedQuantity: number;
  deviation: number; // percentage
  anomalyType: "spike" | "drop" | "unusual_pattern";
  severity: "low" | "medium" | "high";
}

/**
 * Overall forecasting summary
 */
export interface ForecastingSummary {
  generatedAt: string;
  totalProducts: number;
  productsAtRisk: number; // Products that may run out soon
  productsOverstocked: number;
  anomaliesDetected: number;
  forecasts: ProductDemandForecast[];
  anomalies: SalesAnomaly[];
  aiInsights?: string; // AI-generated natural language summary
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  trend: "increasing" | "decreasing" | "stable";
  percentageChange: number;
  periodDays: number;
}
