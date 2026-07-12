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
