/**
 * Demand Forecasting Service
 * Analyzes historical order data to predict demand, detect anomalies, and recommend actions
 */

import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import {
  batchSumAllocationReserved,
  computeCommittedQuantity,
} from "@/lib/products/enrich-product-committed-quantity";
import type {
  ProductSalesHistory,
  ProductDemandForecast,
  SalesAnomaly,
  ForecastingSummary,
  TrendAnalysis,
} from "@/types";

// Configuration
const ANALYSIS_DAYS = 30; // Days of historical data to analyze
const FORECAST_DAYS = 14; // Days to forecast ahead
const ANOMALY_THRESHOLD = 2.0; // Standard deviations for anomaly detection
const REORDER_LEAD_DAYS = 7; // Days lead time for reorder

/**
 * Calculate moving average
 */
function calculateMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    result.push(avg);
  }
  return result;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Analyze trend using linear regression
 */
function analyzeTrend(
  dailySales: { date: string; quantity: number }[],
): TrendAnalysis {
  if (dailySales.length < 7) {
    return {
      trend: "stable",
      percentageChange: 0,
      periodDays: dailySales.length,
    };
  }

  // Simple linear regression
  const n = dailySales.length;
  const xValues = dailySales.map((_, i) => i);
  const yValues = dailySales.map((d) => d.quantity);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * (yValues[i] ?? 0), 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgY = sumY / n;

  // Calculate percentage change over the period
  const percentageChange = avgY > 0 ? (slope * n * 100) / avgY : 0;

  let trend: "increasing" | "decreasing" | "stable";
  if (percentageChange > 10) {
    trend = "increasing";
  } else if (percentageChange < -10) {
    trend = "decreasing";
  } else {
    trend = "stable";
  }

  return { trend, percentageChange, periodDays: n };
}

/**
 * Detect anomalies in sales data
 */
function detectAnomalies(
  productId: string,
  productName: string,
  sku: string,
  dailySales: { date: string; quantity: number }[],
): SalesAnomaly[] {
  const anomalies: SalesAnomaly[] = [];

  if (dailySales.length < 7) return anomalies;

  const quantities = dailySales.map((d) => d.quantity);
  const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
  const stdDev = calculateStdDev(quantities);

  if (stdDev === 0) return anomalies;

  for (const day of dailySales) {
    const zScore = Math.abs((day.quantity - mean) / stdDev);

    if (zScore > ANOMALY_THRESHOLD) {
      const deviation = ((day.quantity - mean) / mean) * 100;
      const anomalyType = day.quantity > mean ? "spike" : "drop";

      let severity: "low" | "medium" | "high";
      if (zScore > 3) {
        severity = "high";
      } else if (zScore > 2.5) {
        severity = "medium";
      } else {
        severity = "low";
      }

      anomalies.push({
        productId,
        productName,
        sku,
        date: day.date,
        actualQuantity: day.quantity,
        expectedQuantity: Math.round(mean),
        deviation: Math.round(deviation),
        anomalyType,
        severity,
      });
    }
  }

  return anomalies;
}

/**
 * Generate demand forecast for a product
 */
function generateProductForecast(
  productId: string,
  productName: string,
  sku: string,
  currentStock: number,
  reservedStock: number,
  dailySales: { date: string; quantity: number }[],
): ProductDemandForecast {
  const availableStock = currentStock - reservedStock;
  const quantities = dailySales.map((d) => d.quantity);

  // Calculate average daily sales
  const averageDailySales =
    quantities.length > 0
      ? quantities.reduce((a, b) => a + b, 0) / quantities.length
      : 0;

  // Calculate predicted daily sales using weighted moving average (recent days weighted more)
  const recentDays = dailySales.slice(-7);
  const recentAvg =
    recentDays.length > 0
      ? recentDays.reduce((sum, d) => sum + d.quantity, 0) / recentDays.length
      : 0;

  // Weight recent data more (70% recent, 30% overall)
  const predictedDailySales =
    recentDays.length >= 7
      ? recentAvg * 0.7 + averageDailySales * 0.3
      : averageDailySales;

  // Calculate days until stockout
  let daysUntilStockout: number | null = null;
  if (predictedDailySales > 0) {
    daysUntilStockout = Math.floor(availableStock / predictedDailySales);
  }

  // Determine reorder recommendation
  let reorderRecommendation: "urgent" | "soon" | "normal" | "overstocked";
  if (daysUntilStockout !== null && daysUntilStockout <= REORDER_LEAD_DAYS) {
    reorderRecommendation = "urgent";
  } else if (
    daysUntilStockout !== null &&
    daysUntilStockout <= REORDER_LEAD_DAYS * 2
  ) {
    reorderRecommendation = "soon";
  } else if (daysUntilStockout !== null && daysUntilStockout > 90) {
    reorderRecommendation = "overstocked";
  } else {
    reorderRecommendation = "normal";
  }

  // Calculate suggested reorder quantity (2 weeks of predicted sales + buffer)
  const suggestedReorderQuantity = Math.ceil(
    predictedDailySales * FORECAST_DAYS * 1.2,
  );

  // Calculate confidence score based on data quality
  let confidenceScore = 50; // Base score
  if (dailySales.length >= 30) confidenceScore += 30;
  else if (dailySales.length >= 14) confidenceScore += 20;
  else if (dailySales.length >= 7) confidenceScore += 10;

  const stdDev = calculateStdDev(quantities);
  const cv = averageDailySales > 0 ? stdDev / averageDailySales : 1;
  if (cv < 0.3)
    confidenceScore += 20; // Low variability = higher confidence
  else if (cv < 0.5) confidenceScore += 10;

  return {
    productId,
    productName,
    sku,
    currentStock,
    availableStock,
    averageDailySales: Math.round(averageDailySales * 100) / 100,
    predictedDailySales: Math.round(predictedDailySales * 100) / 100,
    daysUntilStockout,
    reorderRecommendation,
    suggestedReorderQuantity,
    confidenceScore: Math.min(100, confidenceScore),
  };
}

/**
 * Generate complete forecasting summary for a user
 */
export async function generateForecastingSummary(
  userId: string,
): Promise<ForecastingSummary> {
  // Get all products for user
  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ userId }),
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      reservedQuantity: true,
    },
  });

  // Calculate date range for analysis
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - ANALYSIS_DAYS);

  // Get order items for the analysis period
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        createdAt: { gte: startDate },
        status: { notIn: ["cancelled"] },
      },
    },
    select: {
      productId: true,
      quantity: true,
      order: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  // Group sales by product and day
  const productSalesMap = new Map<string, Map<string, number>>();

  for (const item of orderItems) {
    const dateKey = item.order.createdAt.toISOString().split("T")[0] ?? "";

    if (!productSalesMap.has(item.productId)) {
      productSalesMap.set(item.productId, new Map());
    }

    const dayMap = productSalesMap.get(item.productId)!;
    dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + item.quantity);
  }

  // Generate daily sales array for each product (fill missing days with 0)
  const allDates: string[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    if (dateStr) allDates.push(dateStr);
  }

  const forecasts: ProductDemandForecast[] = [];
  const anomalies: SalesAnomaly[] = [];

  const allocationReservedByProduct = await batchSumAllocationReserved(
    products.map((p) => p.id),
  );

  for (const product of products) {
    const salesMap = productSalesMap.get(product.id) || new Map();

    const dailySales = allDates.map((date) => ({
      date,
      quantity: salesMap.get(date) || 0,
    }));

    const committed = computeCommittedQuantity(
      Number(product.reservedQuantity ?? 0),
      allocationReservedByProduct.get(product.id) ?? 0,
    );

    // Generate forecast
    const forecast = generateProductForecast(
      product.id,
      product.name,
      product.sku,
      Number(product.quantity),
      committed,
      dailySales,
    );
    forecasts.push(forecast);

    // Detect anomalies
    const productAnomalies = detectAnomalies(
      product.id,
      product.name,
      product.sku,
      dailySales,
    );
    anomalies.push(...productAnomalies);
  }

  // Calculate summary statistics
  const productsAtRisk = forecasts.filter(
    (f) =>
      f.reorderRecommendation === "urgent" ||
      f.reorderRecommendation === "soon",
  ).length;
  const productsOverstocked = forecasts.filter(
    (f) => f.reorderRecommendation === "overstocked",
  ).length;

  // Sort forecasts by urgency
  forecasts.sort((a, b) => {
    const urgencyOrder = { urgent: 0, soon: 1, normal: 2, overstocked: 3 };
    return (
      urgencyOrder[a.reorderRecommendation] -
      urgencyOrder[b.reorderRecommendation]
    );
  });

  return {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    productsAtRisk,
    productsOverstocked,
    anomaliesDetected: anomalies.length,
    forecasts,
    anomalies,
  };
}

/**
 * Get products that need immediate attention
 */
export async function getUrgentReorderProducts(
  userId: string,
): Promise<ProductDemandForecast[]> {
  const summary = await generateForecastingSummary(userId);
  return summary.forecasts.filter(
    (f) =>
      f.reorderRecommendation === "urgent" ||
      f.reorderRecommendation === "soon",
  );
}
