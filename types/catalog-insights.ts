/**
 * REQ-0084 — shared catalog entity insights (category, supplier, product detail SSR).
 */

export type CatalogSalesTrendPoint = {
  month: string;
  revenue: number;
  units: number;
};

export type CatalogStockBreakdown = {
  available: number;
  low: number;
  out: number;
};

export type CatalogEntityInsights = {
  lowStockCount: number;
  outOfStockCount: number;
  avgOrderValue: number;
  demandVelocity: number;
  salesTrend: CatalogSalesTrendPoint[];
  stockBreakdown: CatalogStockBreakdown;
  /** Product detail — warehouse allocation totals when SSR stock rows exist. */
  warehouseStock?: {
    available: number;
    reserved: number;
    /** Catalog qty not assigned to any warehouse */
    unallocated?: number;
  };
};
