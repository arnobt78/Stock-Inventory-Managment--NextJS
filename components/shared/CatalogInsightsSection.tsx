/**
 * REQ-0084 — reusable catalog entity insights + charts (category, supplier, product detail).
 */

"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  PackageX,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import {
  CHART_LABEL_TOP_MARGIN,
  createChartBarLabelRenderer,
  formatChartCurrencyLabel,
} from "@/lib/ui/chart-point-label";
import { CATALOG_STOCK_PIE_COLORS } from "@/lib/ui/catalog-insights-chart-data";
import { DetailInfoRow, GlassCard } from "@/components/orders/detail";
import { SectionTitleRow } from "@/components/shared";
import type { CatalogEntityInsights } from "@/types/catalog-insights";
import type { CategoryForecastUrgentRow } from "@/types/category";
import type { ProductDemandForecast } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export type CatalogInsightsSectionProps = {
  insights: CatalogEntityInsights;
  dataLoading: boolean;
  isAdminRole: boolean;
  forecastLoading?: boolean;
  title?: string;
  subtitle?: string;
  salesChartTitle?: string;
  salesChartDescription?: string;
  stockChartTitle?: string;
  stockChartDescription?: string;
  salesChartData: Array<{ label: string; revenue: number; units: number }>;
  stockChartData: Array<{ name: string; value: number }>;
  stockPieColors?: string[];
  /** Multi-product rollup (category/supplier/warehouse). */
  urgentReorderCount?: number;
  predictedDailyDemand?: number;
  /** Single-product admin forecast KPIs. */
  productForecast?: ProductDemandForecast | null;
  urgentRows?: CategoryForecastUrgentRow[];
  productHref?: (productId: string) => string;
  /** When false, hides urgent table even if productHref is set (product detail uses KPI rows only). */
  showUrgentForecastTable?: boolean;
  className?: string;
};

export function CatalogInsightsSection({
  insights,
  dataLoading,
  isAdminRole,
  forecastLoading = false,
  title = "Insights",
  subtitle = "Derived demand and inventory signals",
  salesChartTitle = "Sales trend (6 months)",
  salesChartDescription = "Revenue from order lines",
  stockChartTitle = "Stock breakdown",
  stockChartDescription = "Available vs low vs out of stock",
  salesChartData,
  stockChartData,
  stockPieColors = CATALOG_STOCK_PIE_COLORS,
  urgentReorderCount,
  predictedDailyDemand,
  productForecast,
  urgentRows,
  productHref,
  showUrgentForecastTable = false,
  className,
}: CatalogInsightsSectionProps) {
  const showUrgentTable =
    isAdminRole &&
    productHref &&
    showUrgentForecastTable &&
    (forecastLoading || (urgentRows && urgentRows.length > 0));

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4",
        className,
      )}
    >
      <GlassCard variant="emerald">
        <div className="p-2 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-100/50 dark:border-white/15 dark:bg-white/10">
              <TrendingUp className="h-4 w-4 text-gray-700 dark:text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-white/60">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <DetailInfoRow
              icon={AlertTriangle}
              label="Low stock products:"
              tone="amber"
              loading={dataLoading}
            >
              {!dataLoading && insights.lowStockCount}
            </DetailInfoRow>
            <DetailInfoRow
              icon={PackageX}
              label="Out of stock:"
              tone="rose"
              loading={dataLoading}
            >
              {!dataLoading && insights.outOfStockCount}
            </DetailInfoRow>
            <DetailInfoRow
              icon={DollarSign}
              label="Avg order value:"
              tone="emerald"
              loading={dataLoading}
            >
              {!dataLoading && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ${insights.avgOrderValue.toFixed(2)}
                </span>
              )}
            </DetailInfoRow>
            <DetailInfoRow
              icon={TrendingUp}
              label="Demand velocity (units/day):"
              tone="violet"
              loading={dataLoading}
            >
              {!dataLoading && insights.demandVelocity.toFixed(2)}
            </DetailInfoRow>
            {isAdminRole && productForecast && (
              <>
                <DetailInfoRow
                  icon={Clock}
                  label="Days until stockout:"
                  tone="rose"
                  loading={forecastLoading}
                >
                  {!forecastLoading &&
                    (productForecast.daysUntilStockout ?? "∞")}
                </DetailInfoRow>
                <DetailInfoRow
                  icon={Sparkles}
                  label="Predicted daily sales:"
                  tone="sky"
                  loading={forecastLoading}
                >
                  {!forecastLoading &&
                    productForecast.predictedDailySales.toFixed(1)}
                </DetailInfoRow>
                <DetailInfoRow
                  icon={AlertCircle}
                  label="Reorder status:"
                  tone="amber"
                  loading={forecastLoading}
                >
                  {!forecastLoading && productForecast.reorderRecommendation}
                </DetailInfoRow>
              </>
            )}
            {isAdminRole && !productForecast && (
              <>
                <DetailInfoRow
                  icon={AlertCircle}
                  label="Urgent reorder:"
                  tone="rose"
                  loading={forecastLoading}
                >
                  {!forecastLoading && urgentReorderCount}
                </DetailInfoRow>
                <DetailInfoRow
                  icon={Sparkles}
                  label="Predicted daily demand:"
                  tone="sky"
                  loading={forecastLoading}
                >
                  {!forecastLoading &&
                    predictedDailyDemand?.toFixed(1)}
                </DetailInfoRow>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      <ChartCard
        title={salesChartTitle}
        description={salesChartDescription}
        icon={BarChart3}
        variant="sky"
      >
        <DeferredChartSection
          loading={dataLoading}
          hasData={salesChartData.length > 0}
        >
          <ResponsiveChartContainer>
            <BarChart
              data={salesChartData}
              margin={{
                top: CHART_LABEL_TOP_MARGIN,
                right: 8,
                left: 8,
                bottom: 8,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--chart-1))"
                name="Revenue"
                radius={[4, 4, 0, 0]}
                label={createChartBarLabelRenderer(formatChartCurrencyLabel)}
              />
            </BarChart>
          </ResponsiveChartContainer>
        </DeferredChartSection>
      </ChartCard>

      <ChartCard
        title={stockChartTitle}
        description={stockChartDescription}
        icon={PieChartIcon}
        variant="amber"
      >
        <DeferredChartSection
          loading={dataLoading}
          hasData={stockChartData.length > 0}
        >
          <ResponsiveChartContainer>
            <PieChart>
              <Pie
                data={stockChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stockChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={stockPieColors[index % stockPieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveChartContainer>
        </DeferredChartSection>
      </ChartCard>

      {showUrgentTable && (
        <GlassCard variant="rose" className="lg:col-span-2">
          <div className="p-2 sm:p-4">
            <SectionTitleRow
              as="h3"
              title="Urgent reorder forecast"
              count={
                !forecastLoading ? urgentRows?.length : undefined
              }
            />
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Days left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                {forecastLoading ? (
                  <TableBodyPulseRows rows={5} columnCount={5} />
                ) : (
                  <TableBody>
                    {urgentRows?.map((row) => (
                      <TableRow key={row.productId}>
                        <TableCell>
                          <Link
                            href={productHref!(row.productId)}
                            className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                          >
                            {row.productName}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.sku}
                        </TableCell>
                        <TableCell>{row.availableStock}</TableCell>
                        <TableCell>
                          {row.daysUntilStockout ?? "∞"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {row.reorderRecommendation}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
