/**
 * REQ-0084 — single-product insights from order items + optional warehouse allocations.
 */

import { CATALOG_LOW_STOCK_THRESHOLD } from "@/lib/insights/constants";
import { aggregateWarehouseStockWithUnallocated } from "@/lib/insights/warehouse-stock-aggregate";
import { buildSalesTrend } from "@/lib/server/catalog-insights";
import type { CatalogEntityInsights } from "@/types/catalog-insights";
import type { StockAllocation } from "@/types";

export type ProductInsightOrderItem = {
  quantity: number;
  subtotal: number;
  orderId?: string;
  order?: {
    createdAt?: Date;
    subtotal?: number | null;
    total: number;
  } | null;
};

/** Derive product KPIs + sales trend; warehouse pie when allocations provided. */
export function computeProductInsights(
  quantity: number,
  orderItems: ProductInsightOrderItem[],
  stockAllocations?: StockAllocation[] | null,
): CatalogEntityInsights {
  const qty = Number(quantity);
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let available = 0;
  let low = 0;
  let out = 0;

  if (qty <= 0) {
    outOfStockCount = 1;
    out = 1;
  } else if (qty <= CATALOG_LOW_STOCK_THRESHOLD) {
    lowStockCount = 1;
    low = 1;
  } else {
    available = 1;
  }

  const orderEntries: Array<{ date: Date; revenue: number; units: number }> =
    [];
  let totalQuantitySold = 0;
  let totalRevenue = 0;
  const orderIds = new Set<string>();

  orderItems.forEach((item) => {
    totalQuantitySold += item.quantity;
    const order = item.order;
    if (!order?.createdAt) return;
    const orderSubtotal = order.subtotal ?? 0;
    const share =
      orderSubtotal > 0
        ? (item.subtotal / orderSubtotal) * order.total
        : item.subtotal;
    totalRevenue += share;
    if (item.orderId) orderIds.add(item.orderId);
    orderEntries.push({
      date: order.createdAt,
      revenue: share,
      units: item.quantity,
    });
  });

  const uniqueOrders = orderIds.size;
  const avgOrderValue =
    uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0;

  const dates = orderEntries.map((e) => e.date.getTime());
  const minDate = dates.length ? Math.min(...dates) : Date.now();
  const maxDate = dates.length ? Math.max(...dates) : Date.now();
  const daySpan = Math.max(
    1,
    Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)),
  );
  const demandVelocity = totalQuantitySold / daySpan;

  const warehouseStock = aggregateWarehouseStockWithUnallocated(
    stockAllocations ?? [],
    qty,
  );

  return {
    lowStockCount,
    outOfStockCount,
    avgOrderValue,
    demandVelocity,
    salesTrend: buildSalesTrend(orderEntries),
    stockBreakdown: { available, low, out },
    warehouseStock,
  };
}
