"use client";

/**
 * REQ-0119 — warehouse stock rollup tab on Business Insights.
 * Shell-first: titles/cards render immediately; values pulse when loading.
 */

import Link from "next/link";
import { useMemo } from "react";
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
import { DollarSign, Package, PieChart as PieChartIcon, Warehouse } from "lucide-react";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import { ChartCard } from "@/components/ui/chart-card";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import { TABLE_LINK_PRIMARY } from "@/lib/ui/table-typography";
import {
  buildWarehouseQuantityChartData,
  buildWarehouseRollupMetrics,
  buildWarehouseSharePieData,
} from "@/lib/insights/business-insights-warehouse-rollup";
import { SectionTitleRow } from "@/components/shared";
import {
  CHART_LABEL_TOP_MARGIN,
  createChartBarLabelRenderer,
} from "@/lib/ui/chart-point-label";
import type { WarehouseStockSummary } from "@/types/stock-allocation";

const PIE_COLORS = ["#06b6d4", "#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"];

export type BusinessInsightsWarehouseSectionProps = {
  rows: WarehouseStockSummary[];
  loading: boolean;
};

export function BusinessInsightsWarehouseSection({
  rows,
  loading,
}: BusinessInsightsWarehouseSectionProps) {
  const metrics = useMemo(() => buildWarehouseRollupMetrics(rows), [rows]);
  const quantityChartData = useMemo(
    () => buildWarehouseQuantityChartData(rows),
    [rows],
  );
  const pieData = useMemo(() => buildWarehouseSharePieData(rows), [rows]);

  return (
    <div className="flex flex-col gap-6 text-xs sm:text-sm">
      <SectionTitleRow title="Warehouse stock rollup" icon={Warehouse} />
      <p className="text-xs text-gray-600 dark:text-white/60 -mt-4">
        Allocated inventory across locations
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <AnalyticsCard
          title="Locations with stock"
          value={metrics.warehousesWithStock}
          icon={Warehouse}
          variant="teal"
          description={`${metrics.warehouseCount} warehouses total`}
          valueLoading={loading}
        />
        <AnalyticsCard
          title="Allocated units"
          value={metrics.totalQuantity}
          icon={Package}
          variant="sky"
          description={`${metrics.totalSkus} SKU rows`}
          valueLoading={loading}
        />
        <AnalyticsCard
          title="Reserved units"
          value={metrics.totalReserved}
          icon={Package}
          variant="amber"
          description="Committed on active orders"
          valueLoading={loading}
        />
        <AnalyticsCard
          title="Inventory value"
          value={`$${Math.round(metrics.totalValue).toLocaleString()}`}
          icon={DollarSign}
          variant="emerald"
          description={
            metrics.topWarehouse
              ? `Top: ${metrics.topWarehouse.name} (${metrics.concentrationPct}%)`
              : "No allocations yet"
          }
          valueLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <ChartCard
          title="Quantity by warehouse"
          icon={Warehouse}
          variant="sky"
        >
          <DeferredChartSection
            loading={loading}
            hasData={quantityChartData.length > 0}
            pulseClassName="min-h-[300px]"
          >
            <ResponsiveChartContainer>
              <BarChart
                data={quantityChartData}
                margin={{
                  top: CHART_LABEL_TOP_MARGIN,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="quantity"
                  fill="#06b6d4"
                  label={createChartBarLabelRenderer()}
                />
              </BarChart>
            </ResponsiveChartContainer>
          </DeferredChartSection>
        </ChartCard>

        <ChartCard
          title="Stock share by warehouse"
          icon={PieChartIcon}
          variant="teal"
        >
          <DeferredChartSection
            loading={loading}
            hasData={pieData.length > 0}
            pulseClassName="min-h-[300px]"
          >
            <ResponsiveChartContainer>
              <PieChart>
                <Pie
                  data={pieData}
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
                  fill="#06b6d4"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`wh-pie-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveChartContainer>
          </DeferredChartSection>
        </ChartCard>
      </div>

      <ChartCard title="Warehouse breakdown" icon={Package} variant="violet">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>SKUs</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          {loading && rows.length === 0 ? (
            <TableBodyPulseRows columnCount={5} rows={4} />
          ) : (
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={CARD_EMPTY_MESSAGE_CLASS}>
                    No warehouse allocations yet. Allocate stock from a warehouse
                    detail page.
                  </TableCell>
                </TableRow>
              ) : (
                [...rows]
                  .sort((a, b) => b.totalQuantity - a.totalQuantity)
                  .map((row) => (
                    <TableRow key={row.warehouseId}>
                      <TableCell>
                        <Link
                          href={`/warehouses/${row.warehouseId}`}
                          className={TABLE_LINK_PRIMARY}
                        >
                          {row.warehouseName}
                        </Link>
                      </TableCell>
                      <TableCell>{row.totalProducts}</TableCell>
                      <TableCell>{row.totalQuantity}</TableCell>
                      <TableCell>{row.totalReserved}</TableCell>
                      <TableCell>
                        ${Math.round(row.totalValue).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          )}
        </Table>
      </ChartCard>
    </div>
  );
}
