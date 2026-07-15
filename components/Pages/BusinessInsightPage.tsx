"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { ForecastingCard } from "@/components/ui/forecasting-card";
import { QRCodeComponent } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Download,
  Eye,
  Package,
  PieChart as PieChartIcon,
  QrCode,
  ShoppingCart,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Calendar,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import {
  CHART_LABEL_TOP_MARGIN,
  createChartBarLabelRenderer,
  createChartDotLabelRenderer,
  formatChartCountLabel,
} from "@/lib/ui/chart-point-label";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import PageWithSidebar from "@/components/layouts/PageWithSidebar";
import BusinessInsightsSidebar from "@/components/layouts/BusinessInsightsSidebar";
import { PageContentWrapper, DataSlotPulse, PageSectionHeader } from "@/components/shared";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import {
  InventoryHealthBadge,
  ProductStockStatusBadge,
  StockQuantityLeftBadge,
} from "@/lib/ui/semantic-badges";
import { useProducts, useOrders, useWarehouseStockSummary } from "@/hooks/queries";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryDataMany } from "@/lib/react-query";
import { exportToExcel, exportToCSV } from "@/lib/export";
import type { Product, Order } from "@/types";
import type { ProductForHome } from "@/lib/server/home-data";
import type { OrderForPage } from "@/lib/server/orders-data";
import type { WarehouseStockSummary } from "@/types/stock-allocation";
import { BusinessInsightsWarehouseSection } from "@/components/business-insights/BusinessInsightsWarehouseSection";
import {
  buildWarehouseQuantityChartData,
  buildWarehouseRollupMetrics,
  formatWarehouseRollupForAi,
} from "@/lib/insights/business-insights-warehouse-rollup";
import { cn } from "@/lib/utils";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
} from "@/lib/ui/focus-ring-styles";
import {
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_PRIMARY_BUTTON,
} from "@/lib/ui/glass-button-styles";

/** Date range inputs — violet hue ring, no border-width shift (REQ-0046). */
const BUSINESS_INSIGHT_DATE_INPUT_CLASS = cn(
  "flex-1 sm:flex-none px-2 py-2 text-sm rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 text-gray-700 dark:text-white backdrop-blur-md transition",
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING.violet,
);

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export type BusinessInsightPageProps = {
  initialProducts?: ProductForHome[];
  initialOrders?: OrderForPage[];
  /** REQ-0119 — warehouse stock summary for Warehouses tab SSR */
  initialWarehouseSummary?: WarehouseStockSummary[];
};

/**
 * Business Insights page client component.
 * Uses tabs (Overview, Distribution, Trends, Alerts), cards, and charts only — no table view.
 * Accepts optional server-fetched data to hydrate React Query and avoid client round-trips.
 */
export default function BusinessInsightPage({
  initialProducts,
  initialOrders,
  initialWarehouseSummary,
}: BusinessInsightPageProps = {}) {
  const productsQuery = useProducts(initialProducts as Product[] | undefined);
  const ordersQuery = useOrders(initialOrders as Order[] | undefined);
  const warehouseSummaryQuery = useWarehouseStockSummary(initialWarehouseSummary);
  const allProducts = (productsQuery.data ??
    initialProducts ??
    []) as Product[];
  const allOrders = (ordersQuery.data ?? initialOrders ?? []) as Order[];
  const warehouseSummaryRows =
    warehouseSummaryQuery.data ?? initialWarehouseSummary ?? [];
  const productsLoading = isDataSlotLoading(productsQuery, initialProducts);
  const ordersLoading = isDataSlotLoading(ordersQuery, initialOrders);
  const warehouseSummaryLoading = isDataSlotLoading(
    warehouseSummaryQuery,
    initialWarehouseSummary,
  );
  const dataLoading = productsLoading;

  // REQ-0120 — SSR snapshots for products/orders/warehouse summary (post-CRUD nav parity)
  useSyncSsrQueryDataMany([
    { queryKey: queryKeys.products.lists(), serverData: initialProducts },
    { queryKey: queryKeys.orders.lists(), serverData: initialOrders },
    {
      queryKey: queryKeys.stockAllocation.summary(),
      serverData: initialWarehouseSummary,
    },
  ]);
  const { user } = useAuth();
  const { toast } = useToast();

  // State for QR code URL - set on client side to avoid SSR window error
  const [qrUrl, setQrUrl] = useState("");

  // AI insights (OpenRouter) — generated on demand
  const [aiInsightsText, setAiInsightsText] = useState<string | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsUnavailable, setAiInsightsUnavailable] = useState(false);
  const [insightsTab, setInsightsTab] = useState("overview");

  // State for date range filtering
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });

  // Set QR URL after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/business-insights`);
    }
  }, []);

  // Filter products by date range if specified
  const filteredProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }

    // If no date range is specified, return all products
    if (!dateRange.startDate && !dateRange.endDate) {
      return allProducts;
    }

    return allProducts.filter((product) => {
      const productDate = new Date(product.createdAt);
      productDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day in UTC

      // Filter by start date
      if (dateRange.startDate) {
        const startDate = new Date(dateRange.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        if (productDate < startDate) {
          return false;
        }
      }

      // Filter by end date
      if (dateRange.endDate) {
        const endDate = new Date(dateRange.endDate);
        endDate.setUTCHours(23, 59, 59, 999); // Include entire end date
        if (productDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, dateRange]);

  // Calculate analytics data with corrected calculations
  const analyticsData = useMemo(() => {
    if (!filteredProducts || filteredProducts.length === 0) {
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        availableStockItems: 0,
        averagePrice: 0,
        totalQuantity: 0,
        categoryDistribution: [],
        supplierDistribution: [],
        statusDistribution: [],
        priceRangeDistribution: [],
        monthlyTrend: [],
        topProducts: [],
        lowStockProducts: [],
        stockUtilization: 0,
        valueDensity: 0,
        stockCoverage: 0,
      };
    }

    const totalProducts = filteredProducts.length;

    // CORRECTED: Total value calculation - sum of (price * quantity) for each product
    const totalValue = filteredProducts.reduce((sum, product) => {
      return sum + product.price * Number(product.quantity);
    }, 0);

    // CORRECTED: Low stock items - products with quantity > 0 AND quantity <= 20 (matching product table logic)
    const lowStockItems = filteredProducts.filter(
      (product) =>
        Number(product.quantity) > 0 && Number(product.quantity) <= 20,
    ).length;

    // CORRECTED: Out of stock items - products with quantity = 0
    const outOfStockItems = filteredProducts.filter(
      (product) => Number(product.quantity) === 0,
    ).length;

    const availableStockItems = filteredProducts.filter(
      (product) => Number(product.quantity) > 20,
    ).length;

    // CORRECTED: Total quantity - sum of all quantities
    const totalQuantity = filteredProducts.reduce((sum, product) => {
      return sum + Number(product.quantity);
    }, 0);

    // CORRECTED: Average price calculation - total value divided by total quantity
    const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // CORRECTED: Stock utilization - percentage of products that are not out of stock
    const stockUtilization =
      totalProducts > 0
        ? ((totalProducts - outOfStockItems) / totalProducts) * 100
        : 0;

    // CORRECTED: Value density - total value divided by total products
    const valueDensity = totalProducts > 0 ? totalValue / totalProducts : 0;

    // CORRECTED: Stock coverage - average quantity per product
    const stockCoverage = totalProducts > 0 ? totalQuantity / totalProducts : 0;

    // Category distribution based on quantity (not just count)
    const categoryMap = new Map<
      string,
      { count: number; quantity: number; value: number }
    >();
    filteredProducts.forEach((product) => {
      const category =
        typeof product.category === "object" && product.category
          ? product.category.name
          : (product.category as string | undefined) || "Unknown";
      const current = categoryMap.get(category) || {
        count: 0,
        quantity: 0,
        value: 0,
      };
      categoryMap.set(category, {
        count: current.count + 1,
        quantity: current.quantity + Number(product.quantity),
        value: current.value + product.price * Number(product.quantity),
      });
    });

    // Convert to percentage based on quantity
    const categoryDistribution = Array.from(categoryMap.entries()).map(
      ([name, data]) => ({
        name,
        value: data.quantity,
        count: data.count,
        totalValue: data.value,
      }),
    );

    // Status distribution
    const statusMap = new Map<string, number>();
    filteredProducts.forEach((product) => {
      const status = product.status || "Unknown";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const statusDistribution = Array.from(statusMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    // Price range distribution
    const priceRanges = [
      { name: "$0-$100", min: 0, max: 100 },
      { name: "$100-$500", min: 100, max: 500 },
      { name: "$500-$1000", min: 500, max: 1000 },
      { name: "$1000-$2000", min: 1000, max: 2000 },
      { name: "$2000+", min: 2000, max: Infinity },
    ];

    const priceRangeDistribution = priceRanges.map((range) => ({
      name: range.name,
      value: filteredProducts.filter((product) => {
        if (range.name === "$2000+") {
          // For $2000+ range, include products > $2000 (not including $2000)
          return product.price > 2000;
        } else if (range.name === "$1000-$2000") {
          // For $1000-$2000 range, include products >= $1000 and <= $2000
          return product.price >= range.min && product.price <= range.max;
        } else {
          // For other ranges, include products >= min and < max (exclusive upper bound)
          return product.price >= range.min && product.price < range.max;
        }
      }).length,
    }));

    // CORRECTED: Monthly trend based on actual product creation dates
    const monthlyTrend: Array<{
      month: string;
      products: number;
      monthlyAdded: number;
    }> = [];
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

    // Group products by creation month using UTC to avoid timezone issues
    const productsByMonth = new Map<string, number>();
    filteredProducts.forEach((product) => {
      const date = new Date(product.createdAt);
      // Use UTC methods to ensure consistent month extraction
      const monthKey = `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      productsByMonth.set(monthKey, (productsByMonth.get(monthKey) || 0) + 1);
    });

    // Create trend data for the whole year
    // Use the year from the first product's creation date to ensure correct year mapping
    const dataYear =
      filteredProducts.length > 0 && filteredProducts[0]?.createdAt
        ? new Date(filteredProducts[0].createdAt).getUTCFullYear()
        : new Date().getUTCFullYear();
    let cumulativeProducts = 0;

    months.forEach((month, index) => {
      const monthKey = `${dataYear}-${String(index + 1).padStart(2, "0")}`;
      const productsThisMonth = productsByMonth.get(monthKey) || 0;
      cumulativeProducts += productsThisMonth;

      monthlyTrend.push({
        month,
        products: cumulativeProducts,
        monthlyAdded: productsThisMonth,
      });
    });

    // Top products by value
    const topProducts = filteredProducts
      .sort(
        (a, b) => b.price * Number(b.quantity) - a.price * Number(a.quantity),
      )
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        value: product.price * Number(product.quantity),
        quantity: Number(product.quantity),
      }));

    // Low stock products (matching product table logic: quantity > 0 AND quantity <= 20)
    const lowStockProducts = filteredProducts
      .filter(
        (product) =>
          Number(product.quantity) > 0 && Number(product.quantity) <= 20,
      )
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice(0, 5);

    // Supplier distribution (by quantity and value) - same pattern as category
    const supplierMap = new Map<
      string,
      { count: number; quantity: number; value: number }
    >();
    filteredProducts.forEach((product) => {
      const supplier =
        (product.supplier as string | undefined)?.trim() || "Unknown";
      const current = supplierMap.get(supplier) || {
        count: 0,
        quantity: 0,
        value: 0,
      };
      supplierMap.set(supplier, {
        count: current.count + 1,
        quantity: current.quantity + Number(product.quantity),
        value: current.value + product.price * Number(product.quantity),
      });
    });
    const supplierDistribution = Array.from(supplierMap.entries()).map(
      ([name, data]) => ({
        name,
        value: data.quantity,
        count: data.count,
        totalValue: data.value,
      }),
    );

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      availableStockItems,
      averagePrice,
      totalQuantity,
      stockUtilization,
      valueDensity,
      stockCoverage,
      categoryDistribution,
      supplierDistribution,
      statusDistribution,
      priceRangeDistribution,
      monthlyTrend,
      topProducts,
      lowStockProducts,
    };
  }, [filteredProducts]);

  // Sales / order trend by month (from orders) — respects date range filter
  const orderTrendByMonth = useMemo(() => {
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
    if (!allOrders || allOrders.length === 0) {
      return months.map((month) => ({ month, totalValue: 0, orderCount: 0 }));
    }
    let orders = allOrders;
    if (dateRange.startDate || dateRange.endDate) {
      orders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setUTCHours(0, 0, 0, 0);
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate);
          start.setUTCHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate);
          end.setUTCHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
        return true;
      });
    }
    const byMonth = new Map<
      string,
      { totalValue: number; orderCount: number }
    >();
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const current = byMonth.get(monthKey) || { totalValue: 0, orderCount: 0 };
      byMonth.set(monthKey, {
        totalValue: current.totalValue + order.total,
        orderCount: current.orderCount + 1,
      });
    });
    const dataYear =
      orders.length > 0 && orders[0]?.createdAt
        ? new Date(orders[0].createdAt).getUTCFullYear()
        : new Date().getUTCFullYear();
    return months.map((month, index) => {
      const monthKey = `${dataYear}-${String(index + 1).padStart(2, "0")}`;
      const data = byMonth.get(monthKey) || { totalValue: 0, orderCount: 0 };
      return {
        month,
        totalValue: data.totalValue,
        orderCount: data.orderCount,
      };
    });
  }, [allOrders, dateRange]);

  /**
   * Export analytics data to CSV
   * Includes key metrics, distributions, and product lists
   */
  const handleExportToCSV = useCallback(() => {
    try {
      if (analyticsData.totalProducts === 0) {
        toast({
          title: "No Data to Export",
          description: "There is no analytics data to export.",
          variant: "destructive",
        });
        return;
      }

      // Prepare CSV data with all analytics metrics
      const csvData = [
        // Key Metrics Section
        {
          Section: "Key Metrics",
          Metric: "Total Products",
          Value: analyticsData.totalProducts.toString(),
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Total Value",
          Value: `$${analyticsData.totalValue.toLocaleString()}`,
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Low Stock Items",
          Value: analyticsData.lowStockItems.toString(),
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Out of Stock Items",
          Value: analyticsData.outOfStockItems.toString(),
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Total Quantity",
          Value: analyticsData.totalQuantity.toLocaleString(),
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Average Price",
          Value: `$${analyticsData.averagePrice.toFixed(2)}`,
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Stock Utilization",
          Value: `${analyticsData.stockUtilization.toFixed(1)}%`,
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Value Density",
          Value: `$${analyticsData.valueDensity.toFixed(2)}`,
          "Additional Info": "",
        },
        {
          Section: "Key Metrics",
          Metric: "Stock Coverage",
          Value: analyticsData.stockCoverage.toFixed(1),
          "Additional Info": "",
        },

        // Empty row separator
        { Section: "", Metric: "", Value: "", "Additional Info": "" },

        // Category Distribution Section
        ...analyticsData.categoryDistribution.map((cat) => ({
          Section: "Category Distribution",
          Metric: cat.name,
          Value: cat.value.toString(),
          "Additional Info": `Count: ${cat.count}, Value: $${cat.totalValue.toLocaleString()}`,
        })),

        // Empty row separator
        { Section: "", Metric: "", Value: "", "Additional Info": "" },

        // Status Distribution Section
        ...analyticsData.statusDistribution.map((status) => ({
          Section: "Status Distribution",
          Metric: status.name,
          Value: status.value.toString(),
          "Additional Info": "",
        })),

        // Empty row separator
        { Section: "", Metric: "", Value: "", "": "" },

        // Price Range Distribution Section
        ...analyticsData.priceRangeDistribution.map((range) => ({
          Section: "Price Range Distribution",
          Metric: range.name,
          Value: range.value.toString(),
          "Additional Info": "",
        })),

        // Empty row separator
        { Section: "", Metric: "", Value: "", "": "" },

        // Top Products Section
        ...analyticsData.topProducts.map((product, index) => ({
          Section: "Top Products",
          Metric: product.name,
          Value: `$${product.value.toLocaleString()}`,
          "Additional Info": `Quantity: ${product.quantity}`,
        })),

        // Empty row separator
        { Section: "", Metric: "", Value: "", "": "" },

        // Low Stock Products Section
        ...analyticsData.lowStockProducts.map((product) => ({
          Section: "Low Stock Alerts",
          Metric: product.name,
          Value: product.quantity.toString(),
          "Additional Info": `SKU: ${product.sku || "N/A"}`,
        })),
      ];

      const columns = [
        { header: "Section", key: "Section" },
        { header: "Metric", key: "Metric" },
        { header: "Value", key: "Value" },
        { header: "Additional Info", key: "Additional Info" },
      ];

      exportToCSV(csvData, columns, "stockly-analytics");

      toast({
        title: "CSV Export Successful!",
        description: "Analytics data exported to CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          "Failed to export analytics data to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [analyticsData, toast]);

  /**
   * Export analytics data to Excel
   * Includes multiple sheets with different analytics sections
   */
  const handleExportToExcel = useCallback(async () => {
    try {
      if (analyticsData.totalProducts === 0) {
        toast({
          title: "No Data to Export",
          description: "There is no analytics data to export.",
          variant: "destructive",
        });
        return;
      }

      // Key Metrics Sheet
      const keyMetricsData = [
        { Metric: "Total Products", Value: analyticsData.totalProducts },
        {
          Metric: "Total Value",
          Value: `$${analyticsData.totalValue.toLocaleString()}`,
        },
        { Metric: "Low Stock Items", Value: analyticsData.lowStockItems },
        { Metric: "Out of Stock Items", Value: analyticsData.outOfStockItems },
        {
          Metric: "Total Quantity",
          Value: analyticsData.totalQuantity.toLocaleString(),
        },
        {
          Metric: "Average Price",
          Value: `$${analyticsData.averagePrice.toFixed(2)}`,
        },
        {
          Metric: "Stock Utilization",
          Value: `${analyticsData.stockUtilization.toFixed(1)}%`,
        },
        {
          Metric: "Value Density",
          Value: `$${analyticsData.valueDensity.toFixed(2)}`,
        },
        {
          Metric: "Stock Coverage",
          Value: `${analyticsData.stockCoverage.toFixed(1)} units avg`,
        },
      ];

      await exportToExcel({
        sheetName: "Key Metrics",
        fileName: "stockly-analytics",
        columns: [
          { header: "Metric", key: "Metric", width: 25 },
          { header: "Value", key: "Value", width: 20 },
        ],
        data: keyMetricsData,
      });

      toast({
        title: "Excel Export Successful!",
        description: "Analytics data exported to Excel file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          "Failed to export analytics data to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [analyticsData, toast]);

  /**
   * Handle export button click - shows options for CSV or Excel
   */
  const handleExportAnalytics = useCallback(() => {
    // For now, export CSV by default (can be enhanced with dropdown menu later)
    handleExportToCSV();
  }, [handleExportToCSV]);

  /** Build a short summary string for AI insights from current analytics */
  const buildAiSummary = useCallback(() => {
    const parts = [
      `Total products: ${analyticsData.totalProducts}.`,
      `Total inventory value: $${analyticsData.totalValue.toLocaleString()}.`,
      `Low stock items (qty ≤ 20): ${analyticsData.lowStockItems}.`,
      `Out of stock: ${analyticsData.outOfStockItems}.`,
      `Stock utilization: ${analyticsData.stockUtilization.toFixed(1)}%.`,
    ];
    if (analyticsData.categoryDistribution.length > 0) {
      const top = analyticsData.categoryDistribution
        .slice(0, 3)
        .map((c) => `${c.name} (${c.value} units)`)
        .join("; ");
      parts.push(`Top categories by quantity: ${top}.`);
    }
    const warehouseMetrics = buildWarehouseRollupMetrics(warehouseSummaryRows);
    if (warehouseMetrics.warehousesWithStock > 0) {
      parts.push(
        formatWarehouseRollupForAi(
          warehouseMetrics,
          buildWarehouseQuantityChartData(warehouseSummaryRows),
        ).trim(),
      );
    }
    return parts.join(" ");
  }, [analyticsData, warehouseSummaryRows]);

  /** Generate AI insights via OpenRouter (button-triggered, no auto-call) */
  const handleGenerateAiInsights = useCallback(async () => {
    setAiInsightsLoading(true);
    setAiInsightsUnavailable(false);
    setAiInsightsText(null);
    try {
      const summary = buildAiSummary();
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          typeof data?.error === "string" ? data.error : "Please try again.";
        const code =
          typeof data?.details?.code === "string"
            ? data.details.code
            : undefined;

        if (res.status === 503) {
          setAiInsightsUnavailable(true);
          if (code === "LLM_BILLING" || code === "OPENROUTER_BILLING") {
            toast({
              title: "AI credits exhausted",
              description: errMsg,
              variant: "destructive",
            });
          } else {
            toast({
              title: "AI insights not configured",
              description:
                "Set OPENROUTER_API_KEY and/or GROQ_API_KEY in .env to enable AI-powered insights.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Failed to generate insights",
            description: errMsg,
            variant: "destructive",
          });
        }
        return;
      }
      if (data?.data?.text) {
        setAiInsightsText(data.data.text);
        toast({
          title: "AI insights generated",
          description: "Recommendations are ready.",
        });
      }
    } catch {
      toast({
        title: "Failed to generate insights",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiInsightsLoading(false);
    }
  }, [buildAiSummary, toast]);

  // Radix Tabs: defer until mounted to avoid ID hydration mismatch (REQ-0021 — tabs only, not full page)
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  return (
    <Navbar>
      <PageWithSidebar
        sidebarContent={
          <BusinessInsightsSidebar
            value={insightsTab}
            onValueChange={setInsightsTab}
          />
        }
        sidebarCollapsed={
          <BusinessInsightsSidebar
            value={insightsTab}
            onValueChange={setInsightsTab}
            collapsed
          />
        }
      >
        <PageContentWrapper className="px-1 sm:px-0">
          {/* Header — REQ-0098 PageSectionHeader icon parity */}
          <PageSectionHeader
            as="h1"
            icon={BarChart3}
            tone="violet"
            title="Product Inventory Business Insights"
            description="Analyze your product inventory performance and get insights to improve your business as product owner."
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            trailing={
              <Button
                onClick={handleExportAnalytics}
                className={cn(
                  GLASS_BUTTON_ICON_HOVER,
                  "flex-shrink-0 gap-2",
                  GLASS_PRIMARY_BUTTON.blue,
                )}
                disabled={dataLoading}
              >
                <Download className="h-4 w-4" />
                Export Analytics
              </Button>
            }
          />

          {/* Date Range Filter */}
          <div className="pb-6">
            <div className="rounded-[16px] border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-4 backdrop-blur-md shadow-[0_10px_30px_rgba(139,92,246,0.1)]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
                    <Calendar className="h-4 w-4 text-gray-700 dark:text-white/80" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                    Filter by Date:
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="start-date"
                      className="text-sm text-gray-600 dark:text-white/60 whitespace-nowrap w-10 sm:w-auto"
                    >
                      From:
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className={BUSINESS_INSIGHT_DATE_INPUT_CLASS}
                      max={dateRange.endDate || undefined}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="end-date"
                      className="text-sm text-gray-600 dark:text-white/60 whitespace-nowrap w-10 sm:w-auto"
                    >
                      To:
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className={BUSINESS_INSIGHT_DATE_INPUT_CLASS}
                      min={dateRange.startDate || undefined}
                    />
                  </div>
                  {(dateRange.startDate || dateRange.endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDateRange({ startDate: "", endDate: "" })
                      }
                      className="flex items-center gap-1 rounded-xl border-rose-400/30 hover:border-rose-300/50 hover:bg-rose-500/10"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <AnalyticsCard
              title="Total Products"
              value={analyticsData.totalProducts}
              icon={Package}
              variant="blue"
              description="Products in inventory"
              valueLoading={dataLoading}
            />
            <AnalyticsCard
              title="Total Value"
              value={`$${analyticsData.totalValue.toLocaleString()}`}
              icon={DollarSign}
              variant="emerald"
              description="Total inventory value"
              valueLoading={dataLoading}
            />
            <AnalyticsCard
              title="Low Stock Items"
              value={analyticsData.lowStockItems}
              icon={AlertTriangle}
              variant="amber"
              description="Items with quantity <= 20"
              valueLoading={dataLoading}
            />
            <AnalyticsCard
              title="Out of Stock"
              value={analyticsData.outOfStockItems}
              icon={ShoppingCart}
              variant="rose"
              description="Items with zero quantity"
              valueLoading={dataLoading}
            />
          </div>

          {/* Charts and Insights — render Tabs only after mount to avoid Radix ID hydration mismatch */}
          <div className="pb-6">
            {!isMounted ? (
              <>
                <div
                  className="grid w-full grid-cols-5 h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-4"
                  role="presentation"
                >
                  <div className="h-7 rounded-md bg-gray-200/60 dark:bg-white/10 animate-pulse w-full max-w-[120px]" />
                  <div className="h-7 rounded-md bg-gray-200/60 dark:bg-white/10 animate-pulse w-full max-w-[120px]" />
                  <div className="h-7 rounded-md bg-gray-200/60 dark:bg-white/10 animate-pulse w-full max-w-[120px]" />
                  <div className="h-7 rounded-md bg-gray-200/60 dark:bg-white/10 animate-pulse w-full max-w-[120px]" />
                  <div className="h-7 rounded-md bg-gray-200/60 dark:bg-white/10 animate-pulse w-full max-w-[120px]" />
                </div>
                <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <DataSlotPulse variant="chart" className="min-h-[300px]" />
                  <DataSlotPulse variant="chart" className="min-h-[300px]" />
                </div>
              </>
            ) : (
              <Tabs value={insightsTab} onValueChange={setInsightsTab}>
                <TabsList className="hidden sm:grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <ChartCard
                      title="Category Distribution"
                      icon={PieChartIcon}
                      variant="violet"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.categoryDistribution.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <PieChart>
                            <Pie
                              data={analyticsData.categoryDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent, x, y, textAnchor }) => (
                                <text
                                  x={x}
                                  y={y}
                                  textAnchor={textAnchor}
                                  dominantBaseline="central"
                                  className="fill-gray-700 dark:fill-white text-xs font-normal"
                                >
                                  {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                </text>
                              )}
                              outerRadius="100%"
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {analyticsData.categoryDistribution.map(
                                (_entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ),
                              )}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>

                    <ChartCard
                      title="Product Growth Trend (Full Year)"
                      icon={TrendingUp}
                      variant="sky"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.monthlyTrend.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <AreaChart
                            data={analyticsData.monthlyTrend}
                            margin={{
                              top: CHART_LABEL_TOP_MARGIN,
                              right: 8,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="products"
                              stroke="#8884d8"
                              fill="#8884d8"
                              dot={{ r: 3, fill: "#8884d8" }}
                              label={createChartDotLabelRenderer(
                                analyticsData.monthlyTrend.length,
                                formatChartCountLabel,
                                false,
                              )}
                            />
                          </AreaChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>
                  </div>
                  {!dataLoading && !ordersLoading && allOrders.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-4 text-xs sm:text-sm">
                      <ChartCard
                        title="Sales / Order Value Trend"
                        icon={DollarSign}
                        variant="emerald"
                      >
                        <DeferredChartSection
                          loading={dataLoading || ordersLoading}
                          hasData={orderTrendByMonth.length > 0}
                          pulseClassName="min-h-[300px]"
                        >
                          <ResponsiveChartContainer>
                            <AreaChart
                              data={orderTrendByMonth}
                              margin={{
                                top: CHART_LABEL_TOP_MARGIN,
                                right: 8,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip
                                formatter={(value) => [
                                  value != null
                                    ? `$${Number(value).toLocaleString()}`
                                    : "$0",
                                  "Revenue",
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="totalValue"
                                stroke="#00C49F"
                                fill="#00C49F"
                                dot={{ r: 3, fill: "#00C49F" }}
                                label={createChartDotLabelRenderer(
                                  orderTrendByMonth.length,
                                )}
                              />
                            </AreaChart>
                          </ResponsiveChartContainer>
                        </DeferredChartSection>
                      </ChartCard>
                      <ChartCard
                        title="Order Count by Month"
                        icon={ShoppingCart}
                        variant="amber"
                      >
                        <DeferredChartSection
                          loading={dataLoading || ordersLoading}
                          hasData={orderTrendByMonth.length > 0}
                          pulseClassName="min-h-[300px]"
                        >
                          <ResponsiveChartContainer>
                            <BarChart data={orderTrendByMonth}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Bar
                                dataKey="orderCount"
                                fill="#8884D8"
                                label={createChartBarLabelRenderer(
                                  formatChartCountLabel,
                                )}
                              />
                            </BarChart>
                          </ResponsiveChartContainer>
                        </DeferredChartSection>
                      </ChartCard>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="distribution">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {/* Status Distribution */}
                    <ChartCard
                      title="Status Distribution"
                      icon={Activity}
                      variant="blue"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <ProductStockStatusBadge
                          status="available"
                          label={`Available (${analyticsData.availableStockItems})`}
                        />
                        <ProductStockStatusBadge
                          status="stock_low"
                          label={`Stock Low (${analyticsData.lowStockItems})`}
                        />
                        <ProductStockStatusBadge
                          status="stock_out"
                          label={`Stock Out (${analyticsData.outOfStockItems})`}
                        />
                      </div>
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.statusDistribution.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <BarChart data={analyticsData.statusDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#8884d8"
                              label={createChartBarLabelRenderer()}
                            />
                          </BarChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>

                    {/* Price Range Distribution */}
                    <ChartCard
                      title="Price Range Distribution"
                      icon={BarChart3}
                      variant="teal"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={
                          analyticsData.priceRangeDistribution.length > 0
                        }
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <BarChart data={analyticsData.priceRangeDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#00C49F"
                              label={createChartBarLabelRenderer()}
                            />
                          </BarChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>

                    {/* Category Performance (by value) */}
                    <ChartCard
                      title="Category by Value"
                      icon={PieChartIcon}
                      variant="amber"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.categoryDistribution.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <BarChart
                            data={analyticsData.categoryDistribution}
                            margin={{
                              top: CHART_LABEL_TOP_MARGIN,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [
                                value != null
                                  ? `$${Number(value).toLocaleString()}`
                                  : "$0",
                                "Value",
                              ]}
                            />
                            <Bar
                              dataKey="totalValue"
                              fill="#FFBB28"
                              label={createChartBarLabelRenderer()}
                            />
                          </BarChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>

                    {/* Supplier Performance (by value) */}
                    <ChartCard
                      title="Supplier Performance"
                      icon={Users}
                      variant="orange"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.supplierDistribution.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <BarChart
                            data={analyticsData.supplierDistribution}
                            margin={{
                              top: CHART_LABEL_TOP_MARGIN,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [
                                value != null
                                  ? `$${Number(value).toLocaleString()}`
                                  : "$0",
                                "Value",
                              ]}
                            />
                            <Bar
                              dataKey="totalValue"
                              fill="#FF8042"
                              label={createChartBarLabelRenderer()}
                            />
                          </BarChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>
                  </div>
                </TabsContent>

                <TabsContent value="trends">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {/* Top Products by Value */}
                    <ChartCard
                      title="Top Products by Value"
                      icon={TrendingUp}
                      variant="emerald"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.topProducts.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <BarChart
                            data={analyticsData.topProducts}
                            margin={{
                              top: CHART_LABEL_TOP_MARGIN,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [
                                value
                                  ? `$${Number(value).toLocaleString()}`
                                  : "$0",
                                "Value",
                              ]}
                              labelFormatter={(label) => `Product: ${label}`}
                            />
                            <Bar
                              dataKey="value"
                              fill="#FFBB28"
                              label={createChartBarLabelRenderer()}
                            />
                          </BarChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>

                    {/* Monthly Product Addition Trend */}
                    <ChartCard
                      title="Monthly Product Addition"
                      icon={TrendingDown}
                      variant="rose"
                    >
                      <DeferredChartSection
                        loading={dataLoading}
                        hasData={analyticsData.monthlyTrend.length > 0}
                        pulseClassName="min-h-[300px]"
                      >
                        <ResponsiveChartContainer>
                          <LineChart
                            data={analyticsData.monthlyTrend}
                            margin={{
                              top: CHART_LABEL_TOP_MARGIN,
                              right: 8,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="monthlyAdded"
                              stroke="#FF8042"
                              strokeWidth={2}
                              dot={{ r: 3, fill: "#FF8042" }}
                              label={createChartDotLabelRenderer(
                                analyticsData.monthlyTrend.length,
                                formatChartCountLabel,
                                false,
                              )}
                            />
                          </LineChart>
                        </ResponsiveChartContainer>
                      </DeferredChartSection>
                    </ChartCard>
                  </div>
                </TabsContent>

                <TabsContent value="warehouses">
                  <BusinessInsightsWarehouseSection
                    rows={warehouseSummaryRows}
                    loading={warehouseSummaryLoading}
                  />
                </TabsContent>

                <TabsContent value="alerts">
                  {/* Low Stock Alerts */}
                  <ChartCard
                    title="Low Stock Alerts"
                    icon={AlertTriangle}
                    variant="rose"
                  >
                    <div>
                      {analyticsData.lowStockProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pb-4 text-xs sm:text-sm">
                          {analyticsData.lowStockProducts.map(
                            (product, index) => (
                              <div
                                key={index}
                                className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-4 backdrop-blur-md"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 dark:text-white">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-white/60">
                                      SKU: {product.sku}
                                    </p>
                                  </div>
                                  <StockQuantityLeftBadge quantity={product.quantity} />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-white/60">
                            No low stock alerts at the moment!
                          </p>
                        </div>
                      )}
                    </div>
                  </ChartCard>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Additional Insights */}
          <div className="pb-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
            {/* Quick Insights Card */}
            <article className="rounded-[20px] border border-sky-400/20 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent p-2 sm:p-4 backdrop-blur-md shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)] transition hover:border-sky-300/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/30 bg-sky-100/50 dark:border-white/15 dark:bg-white/10">
                  <Eye className="h-4 w-4 text-gray-700 dark:text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Quick Insights
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    Average Price
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${analyticsData.averagePrice.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    Total Quantity
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      analyticsData.totalQuantity.toLocaleString()
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    Stock Utilization
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      `${analyticsData.stockUtilization.toFixed(1)}%`
                    )}
                  </span>
                </div>
              </div>
            </article>

            {/* Performance Card */}
            <article className="rounded-[20px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-2 sm:p-4 backdrop-blur-md shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)] transition hover:border-emerald-300/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-100/50 dark:border-white/15 dark:bg-white/10">
                  <Users className="h-4 w-4 text-gray-700 dark:text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Performance
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    Inventory Health
                  </span>
                  {dataLoading ? (
                    <DataSlotPulse variant="badge" />
                  ) : (
                    <InventoryHealthBadge lowStockItems={analyticsData.lowStockItems} />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    Stock Coverage
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="text-sm" />
                    ) : (
                      `${analyticsData.stockCoverage.toFixed(1)} units avg`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    Value Density
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${analyticsData.valueDensity.toFixed(2)} per product`
                    )}
                  </span>
                </div>
              </div>
            </article>

            {/* QR Code Card */}
            <article className="rounded-[20px] border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent p-2 sm:p-4 backdrop-blur-md shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)] transition hover:border-violet-300/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
                  <QrCode className="h-4 w-4 text-gray-700 dark:text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Quick QR Code
                </h3>
              </div>
              <QRCodeComponent
                data={qrUrl || "https://localhost:3000/business-insights"}
                title="Dashboard QR"
                size={120}
                showDownload={false}
              />
            </article>

            {/* AI Insights Card */}
            <article className="rounded-[20px] border border-amber-400/20 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-2 sm:p-4 backdrop-blur-md shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)] transition hover:border-amber-300/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-100/50 dark:border-white/15 dark:bg-white/10">
                  <Sparkles className="h-4 w-4 text-gray-700 dark:text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  AI Insights
                </h3>
              </div>
              {aiInsightsUnavailable ? (
                <p className="text-sm text-gray-600 dark:text-white/60">
                  Configure OPENROUTER_API_KEY and/or GROQ_API_KEY in .env to
                  enable AI-powered recommendations.
                </p>
              ) : aiInsightsText ? (
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-white/80">
                    {aiInsightsText}
                  </p>
                  <Button
                    size="sm"
                    className={cn(
                      "w-full h-11 gap-2",
                      GLASS_BUTTON_ICON_HOVER,
                      GLASS_BUTTON_SHELL_RESET,
                      GLASS_PRIMARY_BUTTON.amber,
                    )}
                    onClick={handleGenerateAiInsights}
                    disabled={aiInsightsLoading}
                  >
                    {aiInsightsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        Generating insights…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    Get short AI recommendations based on your current metrics.
                  </p>
                  <Button
                    size="sm"
                    className={cn(
                      "w-full h-11",
                      GLASS_BUTTON_ICON_HOVER,
                      GLASS_BUTTON_SHELL_RESET,
                      GLASS_PRIMARY_BUTTON.amber,
                    )}
                    onClick={handleGenerateAiInsights}
                    disabled={aiInsightsLoading || dataLoading}
                  >
                    {aiInsightsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        Generating insights…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                        Generate AI insights
                      </>
                    )}
                  </Button>
                </div>
              )}
            </article>
          </div>

          {/* Forecasting Section */}
          <div>
            <ForecastingCard products={allProducts} />
          </div>
        </PageContentWrapper>
      </PageWithSidebar>
    </Navbar>
  );
}
