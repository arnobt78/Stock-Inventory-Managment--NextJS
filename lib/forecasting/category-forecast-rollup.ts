/**
 * REQ-0081/0082/0083 — client-safe rollup for CategoryDetailPage.
 * Filters TanStack/API ForecastingSummary.forecasts by category product IDs.
 * Server category SSR does not embed forecast (REQ-0082); rollup runs client-side only.
 */

import type { ProductDemandForecast } from "@/types";
import type {
  CategoryForecastRollup,
  CategoryForecastUrgentRow,
} from "@/types/category";

export type { CategoryForecastRollup, CategoryForecastUrgentRow };

/** Filter global forecasts to category product IDs; rank urgent rows for mini-table. */
export function buildCategoryForecastRollup(
  forecasts: ProductDemandForecast[],
  productIds: Set<string>,
): CategoryForecastRollup {
  const scoped = forecasts.filter((f) => productIds.has(f.productId));
  const urgent = scoped.filter((f) => f.reorderRecommendation === "urgent");
  const soon = scoped.filter((f) => f.reorderRecommendation === "soon");
  const topUrgent: CategoryForecastUrgentRow[] = [...urgent]
    .sort((a, b) => {
      const daysA = a.daysUntilStockout ?? Number.MAX_SAFE_INTEGER;
      const daysB = b.daysUntilStockout ?? Number.MAX_SAFE_INTEGER;
      return daysA - daysB;
    })
    .slice(0, 5)
    .map((f) => ({
      productId: f.productId,
      productName: f.productName,
      sku: f.sku,
      imageUrl: f.imageUrl ?? null,
      categoryId: f.categoryId ?? null,
      categoryName: f.categoryName ?? null,
      supplierId: f.supplierId ?? null,
      supplierName: f.supplierName ?? null,
      supplierImage: f.supplierImage ?? null,
      availableStock: f.availableStock,
      daysUntilStockout: f.daysUntilStockout,
      reorderRecommendation: f.reorderRecommendation,
    }));

  return {
    urgentReorderCount: urgent.length,
    soonReorderCount: soon.length,
    predictedDailyDemand: scoped.reduce(
      (sum, f) => sum + f.predictedDailySales,
      0,
    ),
    topUrgent,
  };
}
