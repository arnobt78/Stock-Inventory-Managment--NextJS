/**
 * REQ-0084 — warehouse stock insights + category mix charts (no sales trend — no order SSR).
 */

"use client";

import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Package,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { ChartCard } from "@/components/ui/chart-card";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import { WAREHOUSE_STOCK_PIE_COLORS } from "@/lib/ui/catalog-insights-chart-data";
import {
  CHART_LABEL_TOP_MARGIN,
  createChartBarLabelRenderer,
  formatChartCountLabel,
} from "@/lib/ui/chart-point-label";
import { DetailInfoRow } from "@/components/orders/detail";
import { GlassCard, SectionTitleRow } from "@/components/shared";
import { UrgentReorderForecastTable } from "@/components/shared/catalog-detail/UrgentReorderForecastTable";
import type { WarehouseInsights } from "@/types/warehouse-insights";
import type { CategoryForecastUrgentRow } from "@/types/category";
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

export type WarehouseInsightsSectionProps = {
  insights: WarehouseInsights;
  dataLoading: boolean;
  isAdminRole: boolean;
  forecastLoading?: boolean;
  urgentRows?: CategoryForecastUrgentRow[];
  productHref?: (productId: string) => string;
  showUrgentForecastTable?: boolean;
  className?: string;
};

export function WarehouseInsightsSection({
  insights,
  dataLoading,
  isAdminRole,
  forecastLoading = false,
  urgentRows,
  productHref,
  showUrgentForecastTable = false,
  className,
}: WarehouseInsightsSectionProps) {
  const stockChartData = [
    { name: "Available", value: insights.stockBreakdown.available },
    { name: "Reserved", value: insights.stockBreakdown.reserved },
  ].filter((row) => row.value > 0);

  const categoryChartData = insights.categoryMix.map((row) => ({
    label: row.name,
    count: row.count,
  }));

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
      <GlassCard padding="body" variant="violet">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
              <Boxes className="h-4 w-4 text-gray-700 dark:text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                Warehouse Insights
              </h3>
              <p className="text-xs text-gray-600 dark:text-white/60">
                Stock allocation signals for this warehouse
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <DetailInfoRow
              icon={Package}
              label="SKUs in warehouse:"
              tone="sky"
              loading={dataLoading}
            >
              {!dataLoading && insights.totalSkus}
            </DetailInfoRow>
            <DetailInfoRow
              icon={TrendingUp}
              label="Total units:"
              tone="violet"
              loading={dataLoading}
            >
              {!dataLoading && insights.totalUnits}
            </DetailInfoRow>
            <DetailInfoRow
              icon={Boxes}
              label="Available units:"
              tone="emerald"
              loading={dataLoading}
            >
              {!dataLoading && insights.availableUnits}
            </DetailInfoRow>
            <DetailInfoRow
              icon={AlertTriangle}
              label="Low-stock SKUs:"
              tone="amber"
              loading={dataLoading}
            >
              {!dataLoading && insights.lowStockSkuCount}
            </DetailInfoRow>
          </div>
      </GlassCard>

      <ChartCard
        title="Stock allocation"
        description="Available vs reserved units"
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
                    fill={
                      WAREHOUSE_STOCK_PIE_COLORS[
                        index % WAREHOUSE_STOCK_PIE_COLORS.length
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveChartContainer>
        </DeferredChartSection>
      </ChartCard>

      {categoryChartData.length > 0 && (
        <ChartCard
          title="Category mix"
          description="SKU count by product category"
          icon={BarChart3}
          variant="sky"
          className="lg:col-span-2"
        >
          <DeferredChartSection
            loading={dataLoading}
            hasData={categoryChartData.length > 0}
          >
            <ResponsiveChartContainer>
              <BarChart
                data={categoryChartData}
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
                  dataKey="count"
                  fill="hsl(var(--chart-2))"
                  name="SKUs"
                  radius={[4, 4, 0, 0]}
                  label={createChartBarLabelRenderer(formatChartCountLabel)}
                />
              </BarChart>
            </ResponsiveChartContainer>
          </DeferredChartSection>
        </ChartCard>
      )}

      {showUrgentTable && productHref && (
        <UrgentReorderForecastTable
          rows={urgentRows}
          loading={forecastLoading}
          productHref={productHref}
          className="lg:col-span-2"
        />
      )}
    </div>
  );
}
