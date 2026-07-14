/**
 * REQ-0084 — warehouse detail insights derived from stock allocations (no extra DB).
 */

export type WarehouseCategoryMixPoint = {
  name: string;
  count: number;
};

export type WarehouseInsights = {
  totalSkus: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  lowStockSkuCount: number;
  stockBreakdown: { available: number; reserved: number };
  categoryMix: WarehouseCategoryMixPoint[];
};

/** REQ-0115 — stat-card shape on WarehouseDetailPage (maps from WarehouseInsights). */
export type WarehouseStockSummary = {
  totalProducts: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
};
