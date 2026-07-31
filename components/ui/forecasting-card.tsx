"use client";

import Link from "next/link";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ForecastUrgencyBadge } from "@/lib/ui/semantic-badges";
import { DenseCatalogProductCell } from "@/components/shared/DenseCatalogProductCell";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Package,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";

/** Resolve product.category to a display name (string | {name} | null). */
function resolveCategoryName(product: Product): string | null {
  if (!product.category) return null;
  if (typeof product.category === "object") return product.category.name;
  return product.category || null;
}

/** Resolve product.supplier to a display name. */
function resolveSupplierName(product: Product): string | null {
  if (!product.supplier) return null;
  if (typeof product.supplier === "object") return product.supplier.name;
  return (product.supplier as string) || null;
}

/** Urgency-based text hue for reorder current stock value. */
function availableStockClass(urgency: "high" | "medium" | "low"): string {
  if (urgency === "high") return "text-rose-600 dark:text-rose-400";
  if (urgency === "medium") return "text-amber-600 dark:text-amber-400";
  return "text-sky-600 dark:text-sky-400";
}

/** Store hrefs for BI page (store owner context). */
const storeProductHref = (id: string) => `/products/${id}`;
const storeCategoryHref = (id: string) => `/categories/${id}`;
const storeSupplierHref = (id: string) => `/suppliers/${id}`;

interface ForecastingCardProps {
  products: Product[];
  className?: string;
}

interface ForecastData {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  reorderSuggestions: Array<{
    product: Product;
    available: number;
    suggestedQuantity: number;
    urgency: "high" | "medium" | "low";
    reason: string;
  }>;
  demandForecast: Array<{
    category: string;
    categoryId?: string | null;
    currentStock: number;
    predictedDemand: number;
    confidence: number;
  }>;
  seasonalTrends: Array<{
    month: string;
    demand: number;
    trend: "up" | "down" | "stable";
    isFutureMonth: boolean;
  }>;
}

export function ForecastingCard({ products, className }: ForecastingCardProps) {
  const { toast } = useToast();

  const forecastData = useMemo((): ForecastData => {
    if (!products || products.length === 0) {
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        reorderSuggestions: [],
        demandForecast: [],
        seasonalTrends: [],
      };
    }

    const availableQty = (product: Product) =>
      (product.quantity ?? 0) - getDisplayCommittedQuantity(product);

    const totalProducts = products.length;
    const lowStockProducts = products.filter((p) => {
      const available = availableQty(p);
      return available > 0 && available <= 20;
    }).length;
    const outOfStockProducts = products.filter(
      (p) => availableQty(p) <= 0,
    ).length;

    // REQ-0168 — Reorder when available <= 20 (same heuristic as Low Stock / Out of Stock cards).
    // Empty list when lowStock + outOfStock === 0 is expected (healthy stock).
    const reorderSuggestions = products
      .map((product) => ({
        product,
        available: availableQty(product),
      }))
      .filter(({ available }) => available <= 20)
      .sort((a, b) => a.available - b.available)
      .map(({ product, available }) => {
        let suggestedQuantity = 20;
        let urgency: "high" | "medium" | "low" = "medium";
        let reason = "Low stock level";

        if (available <= 0) {
          suggestedQuantity = 30;
          urgency = "high";
          reason = "Out of stock";
        } else if (available <= 2) {
          suggestedQuantity = 25;
          urgency = "high";
          reason = "Critical stock level";
        } else if (available <= 5) {
          suggestedQuantity = 20;
          urgency = "medium";
          reason = "Low stock level";
        } else {
          suggestedQuantity = 15;
          urgency = "low";
          reason = "Approaching low stock";
        }

        return {
          product,
          available,
          suggestedQuantity,
          urgency,
          reason,
        };
      })
      .slice(0, 5);

    // Generate demand forecast by category
    const categoryMap = new Map<string, Product[]>();
    products.forEach((product) => {
      const category =
        typeof product.category === "object" && product.category
          ? product.category.name
          : (product.category as string | undefined) || "Unknown";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(product);
    });

    const demandForecast = Array.from(categoryMap.entries()).map(
      ([category, categoryProducts]) => {
        const currentStock = categoryProducts.reduce(
          (sum, p) => sum + p.quantity,
          0,
        );
        const avgPrice =
          categoryProducts.reduce((sum, p) => sum + p.price, 0) /
          categoryProducts.length;

        // Simple demand prediction based on price and current stock
        const predictedDemand = Math.max(
          Math.floor(currentStock * 0.8), // 80% of current stock
          Math.floor(categoryProducts.length * 5), // At least 5 units per product
        );

        const confidence = Math.min(85, Math.max(60, 100 - avgPrice / 10)); // Higher price = lower confidence
        const categoryId = categoryProducts[0]?.categoryId ?? null;

        return {
          category,
          categoryId,
          currentStock,
          predictedDemand,
          confidence,
        };
      },
    );

    // Generate seasonal trends based on actual product creation data
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Group products by creation month for seasonal trends
    const productsByMonth = new Map<string, number>();
    products.forEach((product) => {
      const date = new Date(product.createdAt);
      const monthKey = `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      productsByMonth.set(monthKey, (productsByMonth.get(monthKey) || 0) + 1);
    });

    const dataYear =
      products.length > 0 && products[0]?.createdAt
        ? new Date(products[0].createdAt).getUTCFullYear()
        : new Date().getUTCFullYear();

    const currentDate = new Date();
    const currentMonth = currentDate.getUTCMonth() + 1; // 1-based month
    const currentYear = currentDate.getUTCFullYear();

    const seasonalTrends = months.map((month, index) => {
      const monthKey = `${dataYear}-${String(index + 1).padStart(2, "0")}`;
      const productsThisMonth = productsByMonth.get(monthKey) || 0;

      // Use actual product creation data for demand trends
      const demand = productsThisMonth;

      let trend: "up" | "down" | "stable" = "stable";

      // Only calculate trends for months that have occurred (not future months)
      const monthNumber = index + 1;
      const isCurrentYear = dataYear === currentYear;
      const isPastMonth = !isCurrentYear || monthNumber <= currentMonth;

      if (isPastMonth && index > 0) {
        const prevMonthKey = `${dataYear}-${String(index).padStart(2, "0")}`;
        const prevDemand = productsByMonth.get(prevMonthKey) || 0;

        // Only calculate trend if both months have actual data or are both zero
        if (demand > prevDemand) {
          trend = "up";
        } else if (demand < prevDemand && prevDemand > 0) {
          // Only show "down" if previous month had actual demand
          trend = "down";
        } else {
          trend = "stable";
        }
      }

      return { month, demand, trend, isFutureMonth: !isPastMonth };
    });

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      reorderSuggestions,
      demandForecast,
      seasonalTrends,
    };
  }, [products]);

  const handleGenerateReport = () => {
    toast({
      title: "Generate Report",
      description: "Report generation feature coming soon!",
    });
  };

  const handleViewDetails = () => {
    toast({
      title: "View Details",
      description: "Detailed view feature coming soon!",
    });
  };

  const getTrendIcon = (trend: string, isFutureMonth: boolean = false) => {
    if (isFutureMonth) {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }

    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-sky-500" />;
    }
  };

  return (
    <article
      className={cn(
        "group rounded-[20px] border backdrop-blur-md transition overflow-hidden",
        "border-violet-400/20",
        "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
        "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
        "hover:border-violet-300/40",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white flex items-center gap-2">
          <Target className="h-4 w-4 sm:h-5 sm:w-5" />
          Demand Forecasting & Insights
        </h3>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent">
            <div className="text-sm sm:text-lg font-medium text-sky-600 dark:text-sky-400">
              {forecastData.totalProducts}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/80">
              Total Products
            </div>
          </div>
          <div className="text-center p-2 rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent">
            <div className="text-sm sm:text-lg font-medium text-amber-600 dark:text-amber-400">
              {forecastData.lowStockProducts}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/80">
              Low Stock
            </div>
          </div>
          <div className="text-center p-2 rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent">
            <div className="text-sm sm:text-base font-medium text-rose-600 dark:text-rose-400">
              {forecastData.outOfStockProducts}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/80">
              Out of Stock
            </div>
          </div>
        </div>

        {/* Reorder Suggestions */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-700 dark:text-white">
            <AlertTriangle className="h-4 w-4" />
            Reorder Suggestions
          </h4>
          <div className="space-y-2">
            {forecastData.reorderSuggestions.length > 0 ? (
              forecastData.reorderSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 p-2 rounded-xl border border-gray-300/30 bg-gradient-to-r from-gray-100/50 to-transparent dark:border-white/10 dark:from-white/5 backdrop-blur-md"
                >
                  <div className="flex-1 min-w-0">
                    <DenseCatalogProductCell
                      productId={suggestion.product.id}
                      productName={suggestion.product.name}
                      sku={suggestion.product.sku}
                      imageUrl={suggestion.product.imageUrl}
                      categoryId={suggestion.product.categoryId}
                      categoryName={resolveCategoryName(suggestion.product)}
                      supplierId={suggestion.product.supplierId}
                      supplierName={resolveSupplierName(suggestion.product)}
                      supplierImage={suggestion.product.supplierImage}
                      productHref={storeProductHref}
                      categoryHref={storeCategoryHref}
                      supplierHref={storeSupplierHref}
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span>
                        Current:{" "}
                        <span className={availableStockClass(suggestion.urgency)}>
                          {suggestion.available}
                        </span>
                      </span>
                      <span aria-hidden className="text-gray-400 dark:text-gray-500">·</span>
                      <span>
                        Suggested:{" "}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {suggestion.suggestedQuantity}
                        </span>
                      </span>
                      <span aria-hidden className="text-gray-400 dark:text-gray-500">·</span>
                      <span className="text-gray-500 dark:text-gray-300 italic">
                        {suggestion.reason}
                      </span>
                    </div>
                  </div>
                  <ForecastUrgencyBadge urgency={suggestion.urgency} />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-600 dark:text-white/80">
                {/* REQ-0168 — clarify empty when Low Stock + Out of Stock are both 0 */}
                {forecastData.lowStockProducts +
                  forecastData.outOfStockProducts ===
                0
                  ? "No reorder suggestions — stock levels look healthy"
                  : "No reorder suggestions at this time"}
              </div>
            )}
          </div>
        </div>

        {/* Demand Forecast by Category */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-700 dark:text-white">
            <Tag className="h-4 w-4" />
            Category Demand Forecast
          </h4>
          <div className="space-y-2">
            {forecastData.demandForecast.map((forecast, index) => (
              <div
                key={index}
                className="space-y-2 p-2 rounded-xl border border-gray-300/20 bg-gradient-to-r from-gray-100/30 to-transparent dark:border-white/10 dark:from-white/5"
              >
                <div className="flex justify-between items-center gap-2">
                  {forecast.categoryId ? (
                    <Link
                      href={storeCategoryHref(forecast.categoryId)}
                      prefetch
                      className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 min-w-0 truncate"
                    >
                      <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {forecast.category}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-sm text-gray-700 dark:text-white min-w-0 truncate">
                      <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {forecast.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-300 shrink-0">
                    {forecast.confidence.toFixed(0)}% confidence
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>
                    Current:{" "}
                    <span className="text-sky-600 dark:text-sky-400 font-medium">
                      {forecast.currentStock}
                    </span>
                  </span>
                  <span>
                    Predicted:{" "}
                    <span className={forecast.predictedDemand >= forecast.currentStock ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                      {forecast.predictedDemand}
                    </span>
                  </span>
                </div>
                <Progress value={forecast.confidence} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Trends */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-700 dark:text-white">
            <Clock className="h-4 w-4" />
            Seasonal Demand Trends
          </h4>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {forecastData.seasonalTrends.map((trend, index) => (
              <div
                key={index}
                className={cn(
                  "text-center p-2 rounded-xl border border-gray-300/20 bg-gradient-to-b from-gray-100/30 to-transparent dark:border-white/10 dark:from-white/5",
                  trend.isFutureMonth && "opacity-60",
                )}
              >
                <div className="text-xs font-medium text-gray-700 dark:text-white/80">
                  {trend.month}
                </div>
                <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  {trend.demand}
                </div>
                <div className="flex justify-center mt-1">
                  {getTrendIcon(trend.trend, trend.isFutureMonth)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/20 hover:border-emerald-300/50"
            onClick={handleGenerateReport}
          >
            <Package className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-blue-400/30 bg-gradient-to-r from-blue-500/10 to-transparent hover:from-blue-500/20 hover:border-blue-300/50"
            onClick={handleViewDetails}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
      </div>
    </article>
  );
}
