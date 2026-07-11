"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { PageContentWrapper, PageSectionHeader } from "@/components/shared";
import { useDashboard } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Users,
  Truck,
  FolderTree,
  ShoppingCart,
  FileText,
  Warehouse,
  MessageSquare,
  Star,
  DollarSign,
  BarChart3,
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import { ClientCompactDateTime, CopyableText } from "@/components/shared";
import { formatStableCurrency, formatClientCurrency } from "@/lib/format";
import type { DashboardStats } from "@/types";
import ForecastingSection from "@/components/admin/ForecastingSection";
import {
  OrderStatusBadge,
  TicketStatusBadge,
  ReviewStatusBadge,
  ImportStatusBadge,
} from "@/lib/ui/semantic-badges";
import {
  CARD_LIST_DIVIDE_CLASS,
  CARD_LIST_ROW_CLASS,
  CARD_LIST_META_CLASS,
} from "@/lib/ui/card-list-styles";

/** Hydration-safe USD — en-US locale on server and client (REQ-0019). */
function formatCurrency(value: number): string {
  return formatStableCurrency(value);
}

export type AdminAnalyticsContentProps = {
  initialStats?: DashboardStats | null;
  initialForecasting?: import("@/types").ForecastingSummary;
};

export default function AdminAnalyticsContent({
  initialStats,
  initialForecasting,
}: AdminAnalyticsContentProps = {}) {
  const { toast } = useToast();
  const dashboardQuery = useDashboard(initialStats ?? undefined);
  const stats = dashboardQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotLoading(dashboardQuery, initialStats);

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const buildAiSummary = useCallback(() => {
    if (!stats) return "";
    const c = stats.counts ?? {};
    const r = stats.revenue ?? {};
    const totalRev = (r.fromOrders ?? 0) + (r.fromInvoices ?? 0);
    const parts = [
      `Products: ${c.products ?? 0}. Users: ${c.users ?? 0}. Suppliers: ${c.suppliers ?? 0}. Categories: ${c.categories ?? 0}.`,
      `Orders: ${c.orders ?? 0}. Invoices: ${c.invoices ?? 0}. Warehouses: ${c.warehouses ?? 0}.`,
      `Support tickets: ${c.tickets ?? 0}. Product reviews: ${c.reviews ?? 0}.`,
      `Total revenue (orders + invoices): ${formatStableCurrency(totalRev)}.`,
    ];
    const last = stats.trends?.[stats.trends.length - 1];
    if (last) {
      parts.push(
        `Last month trend: ${last.orders} orders, ${formatStableCurrency(last.revenue)} revenue, ${last.products} new products, ${last.invoices} invoices.`,
      );
    }
    return parts.join(" ");
  }, [stats]);

  const handleGenerateAiInsights = useCallback(async () => {
    setAiLoading(true);
    setAiUnavailable(false);
    setAiText(null);
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
        if (res.status === 503) {
          setAiUnavailable(true);
          toast({
            title: "AI insights not configured",
            description:
              "Set OPENROUTER_API_KEY and/or GROQ_API_KEY in .env to enable AI-powered insights.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to generate insights",
            description: (data?.error as string) ?? "Please try again.",
            variant: "destructive",
          });
        }
        return;
      }
      const text = (data?.data as { text?: string })?.text;
      if (text) {
        setAiText(text);
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
      setAiLoading(false);
    }
  }, [buildAiSummary, toast]);

  const revenueFromOrders =
    stats?.orderAnalytics?.totalRevenueExcludingCancelled ??
    stats?.revenue?.fromOrders ??
    0;

  return (
    <PageContentWrapper>
      <div className="flex flex-col">
        <PageSectionHeader
          as="h1"
          icon={BarChart3}
          tone="violet"
          title="Store Analytics & Dashboard (self + client + supplier + other users)"
          description="Overview, statistics, trends, and AI-powered insights across products, users, suppliers, categories, orders, invoices, warehouses, tickets, and reviews. Store-wide metrics."
        />

        {/* Overview cards — REQ-0021 shell-first: titles/icons always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch pb-6">
          <StatisticsCard
            title="Total Products"
            value={stats?.counts?.products ?? 0}
            description="Products availability"
            icon={Package}
            variant="rose"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Available",
                value: stats?.productStatusBreakdown?.available ?? 0,
              },
              {
                label: "Stock low",
                value: stats?.productStatusBreakdown?.stockLow ?? 0,
              },
              {
                label: "Stock out",
                value: stats?.productStatusBreakdown?.stockOut ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Value"
            value={formatCurrency(stats?.totalInventoryValue ?? 0)}
            description="Total inventory value"
            icon={DollarSign}
            variant="violet"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Orders",
                value: formatCurrency(
                  stats?.orderAnalytics?.totalRevenueExcludingCancelled ??
                    stats?.revenue?.fromOrders ??
                    0,
                ),
              },
              {
                label: "Invoices",
                value: formatCurrency(stats?.revenue?.fromInvoices ?? 0),
              },
              {
                label: "Due",
                value: formatCurrency(
                  stats?.invoiceAnalytics?.outstandingAmount ?? 0,
                ),
              },
              {
                label: "Cancelled",
                value: formatCurrency(
                  stats?.orderAnalytics?.cancelledOrderAmount ?? 0,
                ),
              },
            ]}
          />
          <StatisticsCard
            title="Total Revenue"
            value={formatCurrency(revenueFromOrders)}
            description="Profits (excl. cancelled)"
            icon={DollarSign}
            variant="emerald"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Paid",
                value: formatCurrency(
                  stats?.orderAnalytics?.paidOrderAmount ?? 0,
                ),
              },
              {
                label: "Due",
                value: formatCurrency(
                  stats?.invoiceAnalytics?.outstandingAmount ?? 0,
                ),
              },
              {
                label: "Refund",
                value: formatCurrency(
                  stats?.orderAnalytics?.refundedAmount ?? 0,
                ),
              },
              {
                label: "Pending",
                value: formatCurrency(
                  stats?.orderAnalytics?.pendingOrderAmount ?? 0,
                ),
              },
            ]}
          />
          <StatisticsCard
            title="Total Orders"
            value={stats?.counts?.orders ?? 0}
            description="Total orders placed (self + client)"
            icon={ShoppingCart}
            variant="blue"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Pending",
                value: stats?.orderAnalytics?.statusDistribution?.pending ?? 0,
              },
              {
                label: "Confirmed",
                value:
                  stats?.orderAnalytics?.statusDistribution?.confirmed ?? 0,
              },
              {
                label: "Shipping",
                value:
                  (stats?.orderAnalytics?.statusDistribution?.processing ?? 0) +
                  (stats?.orderAnalytics?.statusDistribution?.shipped ?? 0),
              },
              {
                label: "Refund",
                value: stats?.orderAnalytics?.refundedCount ?? 0,
              },
              {
                label: "Cancel",
                value:
                  stats?.orderAnalytics?.statusDistribution?.cancelled ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Users"
            value={stats?.counts?.users ?? 0}
            description="Registered users"
            icon={Users}
            variant="amber"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Admin",
                value: stats?.userRoleBreakdown?.admin ?? 0,
              },
              {
                label: "Client",
                value: stats?.userRoleBreakdown?.client ?? 0,
              },
              {
                label: "Supplier",
                value: stats?.userRoleBreakdown?.supplier ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Suppliers"
            value={stats?.counts?.suppliers ?? 0}
            description="Suppliers"
            icon={Truck}
            variant="emerald"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Active",
                value: stats?.supplierStatusBreakdown?.active ?? 0,
              },
              {
                label: "Inactive",
                value: stats?.supplierStatusBreakdown?.inactive ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Warehouses"
            value={stats?.counts?.warehouses ?? 0}
            description="Storage locations"
            icon={Warehouse}
            variant="teal"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Active",
                value: stats?.warehouseAnalytics?.activeWarehouses ?? 0,
              },
              {
                label: "Inactive",
                value: stats?.warehouseAnalytics?.inactiveWarehouses ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Invoices"
            value={stats?.counts?.invoices ?? 0}
            description="Total invoices (store-wide)"
            icon={FileText}
            variant="sky"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Paid",
                value: stats?.invoiceAnalytics?.statusDistribution?.paid ?? 0,
              },
              {
                label: "Pending",
                value:
                  (stats?.invoiceAnalytics?.statusDistribution?.draft ?? 0) +
                  (stats?.invoiceAnalytics?.statusDistribution?.sent ?? 0),
              },
              {
                label: "Overdue",
                value:
                  stats?.invoiceAnalytics?.statusDistribution?.overdue ?? 0,
              },
              {
                label: "Cancelled",
                value:
                  stats?.invoiceAnalytics?.statusDistribution?.cancelled ?? 0,
              },
              {
                label: "Refunded",
                value: stats?.orderAnalytics?.refundedCount ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Categories"
            value={stats?.counts?.categories ?? 0}
            description="Product categories"
            icon={FolderTree}
            variant="amber"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Active",
                value: stats?.categoryStatusBreakdown?.active ?? 0,
              },
              {
                label: "Inactive",
                value: stats?.categoryStatusBreakdown?.inactive ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Support Tickets"
            value={stats?.counts?.tickets ?? 0}
            description="Tickets"
            icon={MessageSquare}
            variant="rose"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Open",
                value: stats?.ticketStatusBreakdown?.open ?? 0,
              },
              {
                label: "In progress",
                value: stats?.ticketStatusBreakdown?.in_progress ?? 0,
              },
              {
                label: "Resolved",
                value: stats?.ticketStatusBreakdown?.resolved ?? 0,
              },
              {
                label: "Closed",
                value: stats?.ticketStatusBreakdown?.closed ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Reviews"
            value={stats?.counts?.reviews ?? 0}
            description="Product reviews"
            icon={Star}
            variant="orange"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Pending",
                value: stats?.reviewStatusBreakdown?.pending ?? 0,
              },
              {
                label: "Approved",
                value: stats?.reviewStatusBreakdown?.approved ?? 0,
              },
              {
                label: "Rejected",
                value: stats?.reviewStatusBreakdown?.rejected ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Average Order Value"
            value={formatCurrency(
              stats?.orderAnalytics?.averageOrderValue ?? 0,
            )}
            description="Per order (store-wide)"
            icon={DollarSign}
            variant="sky"
            valueLoading={dataLoading}
            badgeValuesLoading={dataLoading}
            badges={[
              {
                label: "Paid revenue",
                value: formatCurrency(
                  stats?.invoiceAnalytics?.paidRevenue ?? 0,
                ),
              },
              {
                label: "Outstanding",
                value: formatCurrency(
                  stats?.invoiceAnalytics?.outstandingAmount ?? 0,
                ),
              },
            ]}
          />
        </div>

        {/* Trending charts */}
        {stats && stats.trends?.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <ChartCard
              variant="sky"
              title="Orders & revenue over time"
              icon={BarChart3}
              description="Last 12 months. Revenue = order totals (excl. cancelled)."
            >
              <DeferredChartSection
                loading={dataLoading}
                hasData={(stats.trends?.length ?? 0) > 0}
              >
                <ResponsiveChartContainer>
                  <AreaChart data={stats.trends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value, name) => [
                        name === "revenue"
                          ? formatClientCurrency(Number(value ?? 0))
                          : (value ?? 0),
                        name === "revenue"
                          ? "Order revenue (excl. cancelled)"
                          : "Orders",
                      ]}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1) / 0.2)"
                      name="orders"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2) / 0.2)"
                      name="revenue"
                    />
                  </AreaChart>
                </ResponsiveChartContainer>
              </DeferredChartSection>
            </ChartCard>
            <ChartCard
              variant="violet"
              title="New products & invoices"
              icon={TrendingUp}
              description="Last 12 months"
            >
              <DeferredChartSection
                loading={dataLoading}
                hasData={(stats.trends?.length ?? 0) > 0}
              >
                <ResponsiveChartContainer>
                  <BarChart
                    data={stats.trends}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="products"
                      fill="hsl(var(--chart-1))"
                      name="Products"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="invoices"
                      fill="hsl(var(--chart-2))"
                      name="Invoices"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveChartContainer>
              </DeferredChartSection>
            </ChartCard>
          </div>
        )}

        {/* Order Analytics section */}
        {stats && stats.orderAnalytics && (
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-sky-600" />
              Order Analytics
            </h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <StatisticsCard
                title="Average Order Value"
                value={formatCurrency(stats.orderAnalytics.averageOrderValue)}
                description="Per order (incl. cancelled)"
                icon={DollarSign}
                variant="emerald"
                badges={[
                  { label: "Orders", value: stats.counts?.orders },
                  {
                    label: "Excl. cancelled",
                    value:
                      stats.counts?.orders -
                      (stats.orderAnalytics.statusDistribution.cancelled ?? 0),
                  },
                  {
                    label: "Avg (excl.)",
                    value:
                      stats.counts?.orders -
                        (stats.orderAnalytics.statusDistribution.cancelled ??
                          0) >
                      0
                        ? formatCurrency(
                            (stats.orderAnalytics
                              .totalRevenueExcludingCancelled ?? 0) /
                              (stats.counts?.orders -
                                (stats.orderAnalytics.statusDistribution
                                  .cancelled ?? 0)),
                          )
                        : formatCurrency(0),
                  },
                ]}
              />
              <StatisticsCard
                title="Total Order Revenue"
                value={formatCurrency(
                  stats.orderAnalytics.totalRevenueExcludingCancelled ??
                    stats.orderAnalytics.totalRevenue,
                )}
                description="Profits (excl. cancelled)"
                icon={DollarSign}
                variant="sky"
                badges={[
                  {
                    label: "Paid",
                    value: formatCurrency(
                      stats.orderAnalytics.paidOrderAmount ?? 0,
                    ),
                  },
                  {
                    label: "Due",
                    value: formatCurrency(
                      stats.invoiceAnalytics?.outstandingAmount ?? 0,
                    ),
                  },
                  {
                    label: "Refund",
                    value: formatCurrency(
                      stats.orderAnalytics.refundedAmount ?? 0,
                    ),
                  },
                  {
                    label: "Pending",
                    value: formatCurrency(
                      stats.orderAnalytics.pendingOrderAmount ?? 0,
                    ),
                  },
                  {
                    label: "Cancelled",
                    value: formatCurrency(
                      stats.orderAnalytics.cancelledOrderAmount ?? 0,
                    ),
                  },
                ]}
              />
              <StatisticsCard
                title="Completed Orders"
                value={stats.orderAnalytics.statusDistribution.delivered}
                description="Delivered"
                icon={ShoppingCart}
                variant="blue"
                badges={[
                  {
                    label: "Pending",
                    value: stats.orderAnalytics.statusDistribution.pending,
                  },
                  {
                    label: "Confirmed",
                    value: stats.orderAnalytics.statusDistribution.confirmed,
                  },
                  {
                    label: "Shipping",
                    value:
                      (stats.orderAnalytics.statusDistribution.processing ??
                        0) +
                      (stats.orderAnalytics.statusDistribution.shipped ?? 0),
                  },
                  {
                    label: "Delivered",
                    value: stats.orderAnalytics.statusDistribution.delivered,
                  },
                  {
                    label: "Refunded",
                    value: stats.orderAnalytics.refundedCount ?? 0,
                  },
                  {
                    label: "Cancelled",
                    value: stats.orderAnalytics.statusDistribution.cancelled,
                  },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Order Status Distribution */}
              <ChartCard
                variant="sky"
                title="Order Status Distribution"
                icon={BarChart3}
                description="Store-wide"
              >
                <DeferredChartSection loading={dataLoading} hasData={!!stats}>
                  <ResponsiveChartContainer>
                    <BarChart
                      data={[
                        {
                          status: "Pending",
                          count:
                            stats.orderAnalytics.statusDistribution.pending,
                          fill: "hsl(45, 93%, 47%)",
                        },
                        {
                          status: "Confirmed",
                          count:
                            stats.orderAnalytics.statusDistribution.confirmed,
                          fill: "hsl(142, 76%, 36%)",
                        },
                        {
                          status: "Processing",
                          count:
                            stats.orderAnalytics.statusDistribution.processing,
                          fill: "hsl(217, 91%, 60%)",
                        },
                        {
                          status: "Shipped",
                          count:
                            stats.orderAnalytics.statusDistribution.shipped,
                          fill: "hsl(199, 89%, 48%)",
                        },
                        {
                          status: "Delivered",
                          count:
                            stats.orderAnalytics.statusDistribution.delivered,
                          fill: "hsl(142, 71%, 45%)",
                        },
                        {
                          status: "Cancelled",
                          count:
                            stats.orderAnalytics.statusDistribution.cancelled,
                          fill: "hsl(0, 84%, 60%)",
                        },
                      ]}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 70, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        type="category"
                        dataKey="status"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        width={65}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [value, "Orders"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveChartContainer>
                </DeferredChartSection>
              </ChartCard>

              {/* Top Products by Orders — Orders = order lines; Revenue = sum of line subtotals (qty × price) */}
              <ChartCard
                variant="teal"
                title="Top Products by Orders"
                icon={Package}
                description="Store-wide. Revenue = sum of order line subtotals."
              >
                {stats.orderAnalytics.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No order data yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4">Product</th>
                          <th
                            className="py-2 pr-4 text-right"
                            title="Number of order lines"
                          >
                            Lines
                          </th>
                          <th className="py-2 pr-4 text-right">Qty</th>
                          <th className="py-2 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stats.orderAnalytics.topProducts
                          .slice(0, 5)
                          .map((p) => (
                            <tr key={p.productId}>
                              <td
                                className="py-2 pr-4 font-medium truncate max-w-[150px]"
                                title={p.productName}
                              >
                                <Link
                                  href={`/admin/products/${p.productId}`}
                                  className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                >
                                  {p.productName}
                                </Link>
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {p.orderCount}
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {p.totalQuantity}
                              </td>
                              <td className="py-2 text-right">
                                {formatStableCurrency(p.totalRevenue)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
            </div>
          </div>
        )}

        {/* Invoice Analytics section */}
        {stats && stats.invoiceAnalytics && (
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Invoice Analytics
            </h2>

            {/* Summary cards — 4 cards: 2 per row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 items-stretch">
              <StatisticsCard
                title="Avg Invoice Value"
                value={formatCurrency(
                  stats.invoiceAnalytics
                    .averageInvoiceValueExcludingCancelled ??
                    stats.invoiceAnalytics.averageInvoiceValue,
                )}
                description="Per invoice (excl. cancelled)"
                icon={DollarSign}
                variant="amber"
                badges={[
                  { label: "Invoices", value: stats.counts?.invoices },
                  {
                    label: "Excl. cancelled",
                    value:
                      stats.counts?.invoices -
                      (stats.invoiceAnalytics.statusDistribution.cancelled ??
                        0),
                  },
                  {
                    label: "Cancelled",
                    value:
                      stats.invoiceAnalytics.statusDistribution.cancelled ?? 0,
                  },
                  {
                    label: "Total (excl.)",
                    value: formatCurrency(
                      stats.invoiceAnalytics.totalExcludingCancelled ?? 0,
                    ),
                  },
                ]}
              />
              <StatisticsCard
                title="Paid Revenue"
                value={formatCurrency(stats.invoiceAnalytics.paidRevenue)}
                description="Collected"
                icon={DollarSign}
                variant="emerald"
                badges={[
                  {
                    label: "Paid",
                    value: stats.invoiceAnalytics.statusDistribution.paid ?? 0,
                  },
                  {
                    label: "Draft",
                    value: stats.invoiceAnalytics.statusDistribution.draft ?? 0,
                  },
                  {
                    label: "Sent",
                    value: stats.invoiceAnalytics.statusDistribution.sent ?? 0,
                  },
                  {
                    label: "Cancelled",
                    value:
                      stats.invoiceAnalytics.statusDistribution.cancelled ?? 0,
                  },
                ]}
              />
              <StatisticsCard
                title="Outstanding"
                value={formatCurrency(stats.invoiceAnalytics.outstandingAmount)}
                description="Awaiting payment"
                icon={FileText}
                variant="sky"
                badges={[
                  {
                    label: "Draft",
                    value: stats.invoiceAnalytics.statusDistribution.draft ?? 0,
                  },
                  {
                    label: "Sent",
                    value: stats.invoiceAnalytics.statusDistribution.sent ?? 0,
                  },
                  {
                    label: "Overdue",
                    value:
                      stats.invoiceAnalytics.statusDistribution.overdue ?? 0,
                  },
                  {
                    label: "Cancelled",
                    value:
                      stats.invoiceAnalytics.statusDistribution.cancelled ?? 0,
                  },
                ]}
              />
              <StatisticsCard
                title="Overdue"
                value={formatCurrency(stats.invoiceAnalytics.overdueAmount)}
                description="Past due date"
                icon={FileText}
                variant="rose"
                badges={[
                  {
                    label: "Overdue",
                    value:
                      stats.invoiceAnalytics.statusDistribution.overdue ?? 0,
                  },
                  {
                    label: "Amount",
                    value: formatCurrency(stats.invoiceAnalytics.overdueAmount),
                  },
                  {
                    label: "Paid",
                    value: stats.invoiceAnalytics.statusDistribution.paid ?? 0,
                  },
                  {
                    label: "Cancelled",
                    value:
                      stats.invoiceAnalytics.statusDistribution.cancelled ?? 0,
                  },
                ]}
              />
            </div>

            {/* Invoice Status Distribution */}
            <ChartCard
              variant="amber"
              title="Invoice Status Distribution"
              icon={FileText}
              description="Store-wide"
            >
              <DeferredChartSection loading={dataLoading} hasData={!!stats}>
                <ResponsiveChartContainer>
                  <BarChart
                    data={[
                      {
                        status: "Draft",
                        count: stats.invoiceAnalytics.statusDistribution.draft,
                        fill: "hsl(220, 9%, 46%)",
                      },
                      {
                        status: "Sent",
                        count: stats.invoiceAnalytics.statusDistribution.sent,
                        fill: "hsl(217, 91%, 60%)",
                      },
                      {
                        status: "Paid",
                        count: stats.invoiceAnalytics.statusDistribution.paid,
                        fill: "hsl(142, 71%, 45%)",
                      },
                      {
                        status: "Overdue",
                        count:
                          stats.invoiceAnalytics.statusDistribution.overdue,
                        fill: "hsl(0, 84%, 60%)",
                      },
                      {
                        status: "Cancelled",
                        count:
                          stats.invoiceAnalytics.statusDistribution.cancelled,
                        fill: "hsl(0, 0%, 45%)",
                      },
                    ]}
                    layout="vertical"
                    margin={{ top: 8, right: 8, left: 70, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      type="category"
                      dataKey="status"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [value, "Invoices"]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveChartContainer>
              </DeferredChartSection>
            </ChartCard>
          </div>
        )}

        {/* Warehouse Analytics section */}
        {stats &&
          stats.warehouseAnalytics &&
          (() => {
            const typeMap = new Map(
              (stats.warehouseAnalytics.typeDistribution ?? []).map((t) => [
                (t.type ?? "").toLowerCase().trim(),
                t.count,
              ]),
            );
            const knownTypes = ["main", "secondary", "storage", "hub", "store"];
            const othersCount = [...typeMap.entries()].reduce(
              (sum, [k, v]) => (knownTypes.includes(k) ? sum : sum + v),
              0,
            );
            const warehouseTypeBadges = [
              { key: "main", label: "Main" },
              { key: "secondary", label: "Secondary" },
              { key: "storage", label: "Storage" },
              { key: "hub", label: "Hub" },
              { key: "store", label: "Store" },
              { key: "others", label: "Others" },
            ].map(({ key, label }) => ({
              label,
              value: key === "others" ? othersCount : (typeMap.get(key) ?? 0),
            }));
            return (
              <div className="space-y-4">
                <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-amber-500" />
                  Warehouse Analytics
                </h2>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <StatisticsCard
                    title="Total Warehouses"
                    value={stats.warehouseAnalytics.totalWarehouses}
                    description="All locations"
                    icon={Warehouse}
                    variant="teal"
                    badges={[
                      {
                        label: "Active",
                        value: stats.warehouseAnalytics.activeWarehouses,
                      },
                      {
                        label: "Inactive",
                        value: stats.warehouseAnalytics.inactiveWarehouses,
                      },
                    ]}
                  />
                  <StatisticsCard
                    title="Active Warehouses"
                    value={stats.warehouseAnalytics.activeWarehouses}
                    description="Operational"
                    icon={Warehouse}
                    variant="emerald"
                    badges={warehouseTypeBadges}
                  />
                  <StatisticsCard
                    title="Inactive Warehouses"
                    value={stats.warehouseAnalytics.inactiveWarehouses}
                    description="Not in use"
                    icon={Warehouse}
                    variant="rose"
                    badges={warehouseTypeBadges}
                  />
                </div>

                {/* Warehouse Type Distribution */}
                {stats.warehouseAnalytics.typeDistribution.length > 0 && (
                  <ChartCard
                    variant="teal"
                    title="Warehouses by Type"
                    icon={Warehouse}
                    description="Store-wide"
                  >
                    <DeferredChartSection
                      loading={dataLoading}
                      hasData={
                        stats.warehouseAnalytics.typeDistribution.length > 0
                      }
                    >
                      <ResponsiveChartContainer>
                        <BarChart
                          data={stats.warehouseAnalytics.typeDistribution.map(
                            (t, i) => ({
                              type: t.type,
                              count: t.count,
                              fill: `hsl(${(i * 60 + 35) % 360}, 70%, 50%)`,
                            }),
                          )}
                          layout="vertical"
                          margin={{ top: 8, right: 8, left: 90, bottom: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            type="category"
                            dataKey="type"
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                            width={85}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value) => [value, "Warehouses"]}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveChartContainer>
                    </DeferredChartSection>
                  </ChartCard>
                )}
              </div>
            );
          })()}

        {/* Log summary: recent activity — 4 cards: 2 per row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 items-stretch">
            <ChartCard
              variant="sky"
              title="Recent Orders"
              icon={ShoppingCart}
              description="Latest 5"
            >
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -mt-1"
                  asChild
                >
                  <Link href="/admin/orders" className="gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
                {stats.recent.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  <ul className={CARD_LIST_DIVIDE_CLASS}>
                    {stats.recent.orders.slice(0, 5).map((o) => (
                      <li key={o.id} className={CARD_LIST_ROW_CLASS}>
                        <div className="min-w-0 flex-1">
                          <CopyableText value={o.orderNumber} className="max-w-full">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                            >
                              {o.orderNumber}
                            </Link>
                          </CopyableText>
                          <p className={CARD_LIST_META_CLASS}>
                            <ClientCompactDateTime date={o.createdAt} />
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <OrderStatusBadge status={o.status} />
                          <span className="text-xs text-gray-700 dark:text-white">
                            {formatStableCurrency(o.total)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ChartCard>
            <ChartCard
              variant="rose"
              title="Recent Tickets"
              icon={MessageSquare}
              description="Latest 5"
            >
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -mt-1"
                  asChild
                >
                  <Link href="/admin/support-tickets" className="gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
                {stats.recent.tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tickets yet
                  </p>
                ) : (
                  <ul className={CARD_LIST_DIVIDE_CLASS}>
                    {stats.recent.tickets.slice(0, 5).map((t) => (
                      <li key={t.id} className={CARD_LIST_ROW_CLASS}>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/support-tickets/${t.id}`}
                            className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                          >
                            {t.subject}
                          </Link>
                          <p className={CARD_LIST_META_CLASS}>
                            <ClientCompactDateTime date={t.createdAt} />
                          </p>
                        </div>
                        <TicketStatusBadge status={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ChartCard>
            <ChartCard
              variant="orange"
              title="Recent Reviews"
              icon={Star}
              description="Latest 5"
            >
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -mt-1"
                  asChild
                >
                  <Link href="/admin/product-reviews" className="gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
                {stats.recent.reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reviews yet
                  </p>
                ) : (
                  <ul className={CARD_LIST_DIVIDE_CLASS}>
                    {stats.recent.reviews.slice(0, 5).map((r) => (
                      <li key={r.id} className={CARD_LIST_ROW_CLASS}>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/product-reviews/${r.id}`}
                            className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                          >
                            {r.productName} · {r.rating}★
                          </Link>
                          <p className={CARD_LIST_META_CLASS}>
                            <ClientCompactDateTime date={r.createdAt} />
                          </p>
                        </div>
                        <ReviewStatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ChartCard>
            <ChartCard
              variant="blue"
              title="Recent Imports"
              icon={BarChart3}
              description="Latest 5"
            >
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -mt-1"
                  asChild
                >
                  <Link href="/admin/activity-history" className="gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
                {stats.recent.imports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No imports yet
                  </p>
                ) : (
                  <ul className={CARD_LIST_DIVIDE_CLASS}>
                    {stats.recent.imports.slice(0, 5).map((im) => (
                      <li key={im.id} className={CARD_LIST_ROW_CLASS}>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/activity-history/${im.id}`}
                            className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                          >
                            {im.importType} · {im.fileName}
                          </Link>
                          <p className={CARD_LIST_META_CLASS}>
                            <ClientCompactDateTime date={im.createdAt} /> ·{" "}
                            {im.successRows} ok, {im.failedRows} failed
                          </p>
                        </div>
                        <ImportStatusBadge status={im.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ChartCard>
          </div>
        )}

        {/* AI insights */}
        <ChartCard
          variant="violet"
          title="AI-powered insights"
          icon={Sparkles}
          description="Generate recommendations based on overview, growth, and activity."
        >
          <div className="space-y-4">
            <Button
              onClick={handleGenerateAiInsights}
              disabled={aiLoading || !stats}
              className="shrink-0 gap-2"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate insights
                </>
              )}
            </Button>
            {aiUnavailable && (
              <p className="text-sm text-muted-foreground">
                AI insights require OPENROUTER_API_KEY and/or GROQ_API_KEY. Set
                in .env to enable.
              </p>
            )}
            {aiText && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm whitespace-pre-wrap text-foreground">
                {aiText}
              </div>
            )}
            {!aiUnavailable && !aiText && !aiLoading && (
              <p className="text-sm text-muted-foreground">
                Click &quot;Generate insights&quot; to get AI recommendations
                from your dashboard data.
              </p>
            )}
          </div>
        </ChartCard>

        {/* Demand Forecasting Section — inside space-y-4 for gap after AI insights */}
        <ChartCard
          variant="emerald"
          title="Demand Forecasting &amp; Predictions"
          icon={TrendingUp}
          description="Store-wide"
        >
          <ForecastingSection initialForecasting={initialForecasting} />
        </ChartCard>
      </div>
    </PageContentWrapper>
  );
}
