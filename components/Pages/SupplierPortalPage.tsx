"use client";

/**
 * Supplier Portal Page
 * Dashboard for suppliers to view their products, orders, and revenue
 */

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { useSupplierPortalDashboard } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  Truck,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import Navbar from "@/components/layouts/Navbar";
import {
  CopyableText,
  PageContentWrapper,
  DataSlotPulse,
  SectionCardHeader,
  PageSectionHeader,
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  ClientCompactDateTime,
  RecentOrderStatusColumn,
} from "@/components/shared";
import {
  CARD_LIST_DIVIDE_CLASS,
  CARD_LIST_META_CLASS,
  CARD_LIST_ROW_CLASS,
} from "@/lib/ui/card-list-styles";
import { ProductStockFromQuantityBadge } from "@/lib/ui/semantic-badges";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import {
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { cn } from "@/lib/utils";
import { PAGE_STATS_GRID_CLASS } from "@/lib/ui/shell-layout-styles";
import {
  createChartDotLabelRenderer,
  CHART_LABEL_TOP_MARGIN,
} from "@/lib/ui/chart-point-label";
import type { SupplierPortalDashboard } from "@/types";

export type SupplierPortalPageProps = {
  /** REQ-0025 — SSR-passed supplier dashboard */
  initialDashboard?: SupplierPortalDashboard;
};

export default function SupplierPortalPage({
  initialDashboard,
}: SupplierPortalPageProps = {}) {
  const { isCheckingAuth, user } = useAuth();
  const dashboardQuery = useSupplierPortalDashboard(initialDashboard);

  useSyncSsrQueryData(
    [...queryKeys.portal.supplier(), user?.id ?? ""],
    user?.id && initialDashboard !== undefined ? initialDashboard : undefined,
  );

  const dashboard = dashboardQuery.data ?? initialDashboard;
  const dataLoading = isDataSlotUnsettled(dashboardQuery, initialDashboard);
  const showError =
    !dataLoading && !isCheckingAuth && (dashboardQuery.isError || !dashboard);

  if (showError) {
    return (
      <Navbar>
        <PageContentWrapper>
          <div className="space-y-4">
            <h1 className="text-sm sm:text-lg font-medium text-primary">
              Supplier Portal
            </h1>
            <article
              className={cn(
                "rounded-[28px] border border-white/10 dark:border-white/20 p-2 sm:p-4 backdrop-blur-md bg-white/60 dark:bg-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_80px_rgba(255,255,255,0.08)]",
              )}
            >
              <p className="text-muted-foreground text-center">
                {dashboardQuery.isError
                  ? "Failed to load supplier dashboard. Please ensure your account is linked to a supplier entity."
                  : "No supplier data available."}
              </p>
              <div className="flex justify-center mt-4">
                <Button asChild variant="outline">
                  <Link href="/">Go to Dashboard</Link>
                </Button>
              </div>
            </article>
          </div>
        </PageContentWrapper>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="flex flex-col">
          <PageSectionHeader
            as="h1"
            icon={Truck}
            tone="emerald"
            title="Supplier Portal"
            description={
              <>
                Welcome,{" "}
                {dataLoading ? (
                  <DataSlotPulse variant="text-sm" />
                ) : (
                  dashboard?.supplierName
                )}
              </>
            }
          />

          {/* Summary Cards — supplier's products/orders/revenue only */}
          <div
            className={cn(
              PAGE_STATS_GRID_CLASS,
              "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
            )}
          >
            <StatisticsCard
              title="Total Products"
              value={dashboard?.totalProducts ?? 0}
              description="Products in your catalog"
              icon={Package}
              variant="sky"
              valueLoading={dataLoading}
              badgeValuesLoading={dataLoading}
              badges={[
                {
                  label: "Available",
                  value:
                    dashboard?.productStatusCounts?.available ??
                    (dashboard?.totalProducts ?? 0) -
                      (dashboard?.lowStockProducts.length ?? 0),
                },
                {
                  label: "Stock low",
                  value:
                    dashboard?.productStatusCounts?.stockLow ??
                    dashboard?.lowStockProducts.length ??
                    0,
                },
                {
                  label: "Stock out",
                  value: dashboard?.productStatusCounts?.stockOut ?? 0,
                },
                {
                  label: "Product value",
                  value: `$${(dashboard?.productValue ?? 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}`,
                },
              ]}
            />
            <StatisticsCard
              title="Total Orders"
              value={dashboard?.totalOrders ?? 0}
              description="Orders containing your products"
              icon={ShoppingCart}
              variant="emerald"
              valueLoading={dataLoading}
              badgeValuesLoading={dataLoading}
              badges={[
                {
                  label: "Pending",
                  value: dashboard?.orderStatusCounts?.pending ?? 0,
                },
                {
                  label: "In progress",
                  value: dashboard?.orderStatusCounts?.inProgress ?? 0,
                },
                {
                  label: "Shipped",
                  value: dashboard?.orderStatusCounts?.shipped ?? 0,
                },
                {
                  label: "Delivered",
                  value: dashboard?.orderStatusCounts?.delivered ?? 0,
                },
                {
                  label: "Refunded",
                  value: dashboard?.orderStatusCounts?.refunded ?? 0,
                },
                {
                  label: "Cancelled",
                  value: dashboard?.orderStatusCounts?.cancelled ?? 0,
                },
              ]}
            />
            <StatisticsCard
              title="Pending Orders"
              value={dashboard?.pendingOrders ?? 0}
              description="Orders awaiting action"
              icon={Clock}
              variant="amber"
              valueLoading={dataLoading}
              badgeValuesLoading={dataLoading}
              badges={[
                {
                  label: "Cancelled",
                  value: dashboard?.orderStatusCounts?.cancelled ?? 0,
                },
                {
                  label: "Completed",
                  value: dashboard?.orderStatusCounts?.completed ?? 0,
                },
                {
                  label: "Refunded",
                  value: dashboard?.orderStatusCounts?.refunded ?? 0,
                },
                { label: "Of Total", value: dashboard?.totalOrders ?? 0 },
              ]}
            />
            <StatisticsCard
              title="Total Revenue"
              value={`$${(dashboard?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              description="Revenue from your products (excl. cancelled)"
              icon={DollarSign}
              variant="violet"
              valueLoading={dataLoading}
              badgeValuesLoading={dataLoading}
              badges={[
                {
                  label: "Paid",
                  value: `$${(
                    dashboard?.revenueBreakdown?.paid ??
                    dashboard?.paidRevenue ??
                    0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Partial",
                  value: `$${(
                    dashboard?.revenueBreakdown?.partial ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Due",
                  value: `$${(
                    dashboard?.revenueBreakdown?.due ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Refund",
                  value: `$${(
                    dashboard?.revenueBreakdown?.refund ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Pending",
                  value: `$${(
                    dashboard?.revenueBreakdown?.pending ??
                    dashboard?.unpaidRevenue ??
                    0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                ...((dashboard?.totalOrders ?? 0) > 0
                  ? [
                      {
                        label: "Avg/Order",
                        value: `$${(
                          (dashboard?.totalRevenue ?? 0) /
                          Math.max(
                            1,
                            (dashboard?.totalOrders ?? 0) -
                              (dashboard?.orderStatusCounts?.cancelled ?? 0),
                          )
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          {/* Revenue Chart — glassmorphic card */}
          <div className="pb-6">
            <article
              className={cn(
                "rounded-[28px] border border-emerald-400/20 dark:border-emerald-400/30 p-2 sm:p-4 backdrop-blur-md transition-all",
                "bg-white/60 dark:bg-white/5",
                "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/25 dark:via-emerald-500/10 dark:to-emerald-500/5",
                "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]",
                "hover:border-emerald-300/40",
              )}
            >
              <SectionCardHeader
                className="mb-4"
                icon={TrendingUp}
                tone="emerald"
                title="Monthly Revenue"
                description="Revenue from your products over the last 6 months (grouped by month)"
              />
              <DeferredChartSection
                loading={dataLoading}
                hasData={(dashboard?.monthlyRevenue.length ?? 0) > 0}
                emptyMessage={
                  <p className="text-muted-foreground text-center py-8">
                    No revenue data yet
                  </p>
                }
              >
                <ResponsiveChartContainer>
                  <AreaChart
                    data={dashboard!.monthlyRevenue}
                    margin={{
                      top: CHART_LABEL_TOP_MARGIN,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#10b98133"
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                      label={createChartDotLabelRenderer(
                        dashboard!.monthlyRevenue.length,
                      )}
                    />
                  </AreaChart>
                </ResponsiveChartContainer>
              </DeferredChartSection>
            </article>
          </div>

          <div className="pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
              {/* Recent Orders — glassmorphic */}
              <article
                className={cn(
                  "rounded-[28px] border border-sky-400/20 dark:border-sky-400/30 p-2 sm:p-4 backdrop-blur-md transition-all",
                  "bg-white/60 dark:bg-white/5",
                  "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-500/25 dark:via-sky-500/10 dark:to-sky-500/5",
                  "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]",
                  "hover:border-sky-300/40",
                )}
              >
                <SectionCardHeader
                  className="mb-4"
                  icon={ShoppingCart}
                  tone="sky"
                  title="Recent Orders"
                  description="Orders containing your products"
                />
                <div>
                  {dataLoading ? (
                    <ul className="space-y-3 py-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <DataSlotPulse variant="text-sm" className="w-32" />
                          <DataSlotPulse variant="badge" />
                        </li>
                      ))}
                    </ul>
                  ) : (dashboard?.recentOrders.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No orders yet
                    </p>
                  ) : (
                    <ul className={CARD_LIST_DIVIDE_CLASS}>
                      {dashboard!.recentOrders.slice(0, 5).map((order) => (
                        <li key={order.id} className={CARD_LIST_ROW_CLASS}>
                          <div className="min-w-0">
                            <CopyableText
                              value={order.orderNumber}
                              className="max-w-full"
                            >
                              <Link
                                href={`/orders/${order.id}`}
                                prefetch
                                className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                              >
                                {order.orderNumber}
                              </Link>
                            </CopyableText>
                            <span className={CARD_LIST_META_CLASS}>
                              {order.productCount} products ·{" "}
                              <ClientCompactDateTime
                                date={order.createdAt}
                                semantic="created"
                              />
                            </span>
                          </div>
                          <RecentOrderStatusColumn
                            status={order.status}
                            statusAt={order.statusAt}
                            paymentStatus={order.paymentStatus}
                            trailing={
                              <span className="text-xs font-normal text-gray-700 dark:text-white">
                                ${order.total.toFixed(2)}
                              </span>
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "group w-full gap-2",
                        GLASS_BUTTON_ICON_HOVER,
                        GLASS_BUTTON_SHELL_RESET,
                        GLASS_ACTION_BUTTON.sky,
                      )}
                    >
                      <Link href="/orders">
                        <ArrowRight className="h-4 w-4 shrink-0" />
                        View All Orders
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>

              {/* Low Stock Products — glassmorphic */}
              <article
                id="products"
                className={cn(
                  "rounded-[28px] border border-amber-400/20 dark:border-amber-400/30 p-2 sm:p-4 backdrop-blur-md transition-all",
                  "bg-white/60 dark:bg-white/5",
                  "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/25 dark:via-amber-500/10 dark:to-amber-500/5",
                  "shadow-[0_15px_40px_rgba(245,158,11,0.15)] dark:shadow-[0_30px_80px_rgba(245,158,11,0.2)]",
                  "hover:border-amber-300/40",
                )}
              >
                <SectionCardHeader
                  className="mb-4"
                  icon={AlertTriangle}
                  tone="amber"
                  title="Low Stock Products"
                  description="Products with 20 or fewer available units (same threshold as product owner)"
                />
                <div>
                  {dataLoading ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">
                            Available
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBodyPulseRows rows={5} columnCount={3} />
                    </Table>
                  ) : (dashboard?.lowStockProducts.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      All products have sufficient stock
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">
                              Available
                            </TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard!.lowStockProducts
                            .slice(0, 5)
                            .map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <Link
                                    href={`/products/${product.id}`}
                                    prefetch
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {product.name}
                                  </Link>
                                  <p className="text-xs text-muted-foreground">
                                    {product.sku}
                                  </p>
                                </TableCell>
                                <TableCell className="text-right font-normal text-red-600">
                                  {product.quantity}
                                </TableCell>
                                <TableCell>
                                  <ProductStockFromQuantityBadge
                                    available={product.quantity}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "group w-full gap-2",
                        GLASS_BUTTON_ICON_HOVER,
                        GLASS_BUTTON_SHELL_RESET,
                        GLASS_ACTION_BUTTON.amber,
                      )}
                    >
                      <Link href="/products">
                        <ArrowRight className="h-4 w-4 shrink-0" />
                        View All Products
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
