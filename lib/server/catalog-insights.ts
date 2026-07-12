/**
 * REQ-0084 — shared catalog insights from loaded products + order items (no extra DB).
 * Used by category and supplier detail SSR; product uses product-insights.ts.
 */

import { CATALOG_LOW_STOCK_THRESHOLD } from "@/lib/insights/constants";
import type { CatalogEntityInsights, CatalogSalesTrendPoint } from "@/types/catalog-insights";

export { CATALOG_LOW_STOCK_THRESHOLD };

/** @deprecated Use CATALOG_LOW_STOCK_THRESHOLD — kept for category-detail-data re-export. */
export const CATEGORY_LOW_STOCK_THRESHOLD = CATALOG_LOW_STOCK_THRESHOLD;

export type CatalogInsightProduct = {
  quantity: number | bigint;
  orderItems?: Array<{
    quantity: number;
    subtotal: number;
    order?: {
      createdAt?: Date;
      subtotal?: number | null;
      total: number;
    } | null;
  }> | null;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Build last-six-month revenue/units buckets from order line entries. */
export function buildSalesTrend(
  orderEntries: Array<{ date: Date; revenue: number; units: number }>,
): CatalogSalesTrendPoint[] {
  const bucket = new Map<string, { revenue: number; units: number }>();
  for (const entry of orderEntries) {
    const key = monthKey(entry.date);
    const prev = bucket.get(key) ?? { revenue: 0, units: 0 };
    bucket.set(key, {
      revenue: prev.revenue + entry.revenue,
      units: prev.units + entry.units,
    });
  }
  const sortedKeys = [...bucket.keys()].sort();
  const lastSix = sortedKeys.slice(-6);
  return lastSix.map((month) => ({
    month,
    revenue: bucket.get(month)?.revenue ?? 0,
    units: bucket.get(month)?.units ?? 0,
  }));
}

/** Multi-product entity insights (category, supplier). */
export function computeCatalogInsights(
  products: CatalogInsightProduct[],
  totalRevenue: number,
  uniqueOrders: number,
  totalQuantitySold: number,
): CatalogEntityInsights {
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let available = 0;
  let low = 0;
  let out = 0;

  const orderEntries: Array<{ date: Date; revenue: number; units: number }> =
    [];

  products.forEach((product) => {
    const qty = Number(product.quantity);
    if (qty <= 0) {
      outOfStockCount += 1;
      out += 1;
    } else if (qty <= CATALOG_LOW_STOCK_THRESHOLD) {
      lowStockCount += 1;
      low += 1;
    } else {
      available += 1;
    }

    product.orderItems?.forEach((item) => {
      const order = item.order;
      if (!order?.createdAt) return;
      const orderSubtotal = order.subtotal ?? 0;
      const share =
        orderSubtotal > 0
          ? (item.subtotal / orderSubtotal) * order.total
          : item.subtotal;
      orderEntries.push({
        date: order.createdAt,
        revenue: share,
        units: item.quantity,
      });
    });
  });

  const avgOrderValue = uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0;

  const dates = orderEntries.map((e) => e.date.getTime());
  const minDate = dates.length ? Math.min(...dates) : Date.now();
  const maxDate = dates.length ? Math.max(...dates) : Date.now();
  const daySpan = Math.max(
    1,
    Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)),
  );
  const demandVelocity = totalQuantitySold / daySpan;

  return {
    lowStockCount,
    outOfStockCount,
    avgOrderValue,
    demandVelocity,
    salesTrend: buildSalesTrend(orderEntries),
    stockBreakdown: { available, low, out },
  };
}

/** @deprecated Use computeCatalogInsights — category tests alias. */
export const computeCategoryInsights = computeCatalogInsights;
