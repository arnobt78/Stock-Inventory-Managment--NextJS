"use client";

/**
 * Client Portal Page
 * Dashboard for clients to view their orders, invoices, and spending
 */

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import {
  useClientPortalDashboard,
  useClientCatalogOverview,
} from "@/hooks/queries";
import { useAuth } from "@/contexts";
import {
  ShoppingCart,
  FileText,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  Package,
  Store,
  Layers,
  Boxes,
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
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper, DataSlotPulse } from "@/components/shared";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { isDataSlotLoading } from "@/lib/react-query";
import { cn } from "@/lib/utils";

/** Catalog badge: Active = green (success), Inactive = secondary (gray) — matches admin/user style */
function CatalogStatusBadge({ status }: { status: string }) {
  const isActive = status === "Active";
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(
        isActive &&
          "border-transparent bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700",
      )}
    >
      {status}
    </Badge>
  );
}

/** Product status in catalog: Available = green, Stock Low = amber, Stock Out = red — matches admin/product table */
function ProductStatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "_");
  const style =
    normalized === "available"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300/30"
      : normalized === "stock_low"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300/30"
        : normalized === "stock_out"
          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300/30"
          : "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={style}>
      {status || "—"}
    </Badge>
  );
}

/** Order status badge colors — match admin/OrderTableColumns (soft bg + text) */
const ORDER_STATUS_STYLE: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300/30",
  confirmed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300/30",
  processing:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300/30",
  shipped:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300/30",
  delivered:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300/30",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300/30",
};

/**
 * Get order status badge variant (matches admin order table colors)
 */
function getOrderStatusBadge(status: string) {
  const style =
    ORDER_STATUS_STYLE[status] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={style}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
    </Badge>
  );
}

/** Invoice status badge colors — match admin/InvoiceTableColumns */
const INVOICE_STATUS_STYLE: Record<string, string> = {
  draft:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300/30",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300/30",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300/30",
  overdue:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300/30",
  cancelled:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300/30",
};

/**
 * Get invoice status badge variant (matches admin invoice table colors)
 */
function getInvoiceStatusBadge(status: string) {
  const style =
    INVOICE_STATUS_STYLE[status] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={style}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
    </Badge>
  );
}

export default function ClientPortalPage() {
  const { isCheckingAuth } = useAuth();
  const dashboardQuery = useClientPortalDashboard();
  const catalogQuery = useClientCatalogOverview();
  const dashboard = dashboardQuery.data;
  const catalog = catalogQuery.data;
  const dashboardLoading = isDataSlotLoading(dashboardQuery);
  const catalogLoading = isDataSlotLoading(catalogQuery);
  const showError =
    !dashboardLoading &&
    !isCheckingAuth &&
    (dashboardQuery.isError || !dashboard);

  if (showError) {
    return (
      <Navbar>
        <PageContentWrapper>
          <div className="space-y-4">
            <h1 className="text-lg sm:text-xl font-semibold text-primary">
              Client Portal
            </h1>
            <article
              className={cn(
                "rounded-[28px] border border-white/10 dark:border-white/20 p-2 sm:p-4 backdrop-blur-sm bg-white/60 dark:bg-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_80px_rgba(255,255,255,0.08)]",
              )}
            >
              <p className="text-muted-foreground text-center">
                Failed to load client dashboard?.
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
        <div className="space-y-4">
          <div className="">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
              Client Portal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Welcome,{" "}
              {dashboardLoading ? (
                <DataSlotPulse variant="text-sm" />
              ) : (
                dashboard?.clientName
              )}
            </p>
          </div>

          {/* Summary Cards — glassmorphic round-28px, same style as business-insights / homepage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <StatisticsCard
              title="Total Orders"
              value={dashboard?.totalOrders ?? 0}
              description="Your order history"
              icon={ShoppingCart}
              variant="sky"
              valueLoading={dashboardLoading}
              badgeValuesLoading={dashboardLoading}
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
                  value: dashboard?.refundedOrdersCount ?? 0,
                },
              ]}
            />
            <StatisticsCard
              title="Awaiting Payment"
              value={dashboard?.ordersAwaitingPayment ?? 0}
              description="Orders awaiting payment"
              icon={Clock}
              variant="amber"
              valueLoading={dashboardLoading}
              badgeValuesLoading={dashboardLoading}
              badges={[
                {
                  label: "Cancelled",
                  value: dashboard?.orderStatusCounts?.cancelled ?? 0,
                },
                {
                  label: "Completed",
                  value: dashboard?.ordersCompleted ?? 0,
                },
                {
                  label: "Refunded",
                  value: dashboard?.refundedOrdersCount ?? 0,
                },
                { label: "Of Total", value: dashboard?.totalOrders },
              ]}
            />
            <StatisticsCard
              title="Total Spent"
              value={`$${(dashboard?.totalSpent ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              description="Total order value"
              icon={DollarSign}
              variant="emerald"
              valueLoading={dashboardLoading}
              badgeValuesLoading={dashboardLoading}
              badges={[
                {
                  label: "Paid",
                  value: `$${(
                    dashboard?.paymentBreakdown?.paid ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Due",
                  value: `$${(
                    dashboard?.paymentBreakdown?.due ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Refund",
                  value: `$${(
                    dashboard?.paymentBreakdown?.refund ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Pending",
                  value: `$${(
                    dashboard?.paymentBreakdown?.pending ?? 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                },
                {
                  label: "Cancelled",
                  value: `$${(
                    dashboard?.paymentBreakdown?.cancelled ?? 0
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
                          (dashboard?.totalSpent ?? 0) / (dashboard?.totalOrders ?? 1)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                      },
                    ]
                  : []),
              ]}
            />
            <StatisticsCard
              title="Outstanding"
              value={`$${(dashboard?.outstandingAmount ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              description="Unpaid invoice balance"
              icon={AlertCircle}
              variant="rose"
              valueLoading={dashboardLoading}
              badgeValuesLoading={dashboardLoading}
              badges={[
                ...(dashboard?.outstandingAmount === 0
                  ? [{ label: "Status", value: "All Paid" }]
                  : []),
                {
                  label: "Invoices Paid",
                  value: dashboard?.invoiceBreakdown?.paid ?? 0,
                },
                {
                  label: "Pending",
                  value: dashboard?.invoiceBreakdown?.pending ?? 0,
                },
                {
                  label: "Overdue",
                  value: dashboard?.invoiceBreakdown?.overdue ?? 0,
                },
                {
                  label: "Cancelled",
                  value: dashboard?.invoiceBreakdown?.cancelled ?? 0,
                },
                {
                  label: "Total Invoices",
                  value: dashboard?.invoiceBreakdown?.total ?? 0,
                },
              ]}
            />
          </div>

          <article
            className={cn(
              "rounded-[28px] border border-emerald-400/20 dark:border-emerald-400/30 p-2 sm:p-4 backdrop-blur-sm transition-all",
              "bg-white/60 dark:bg-white/5",
              "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/25 dark:via-emerald-500/10 dark:to-emerald-500/5",
              "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]",
              "hover:border-emerald-300/40",
            )}
          >
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-white">
                <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                Monthly Spending
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                Your spending over the last 6 months (grouped by month)
              </p>
            </div>
            {dashboardLoading ? (
              <DataSlotPulse variant="chart" className="min-h-[240px]" />
            ) : (dashboard?.monthlySpending.length ?? 0) > 0 ? (
              <ResponsiveChartContainer>
                <AreaChart
                  data={dashboard!.monthlySpending}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "Spent",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="#3b82f6"
                    fill="#3b82f633"
                  />
                </AreaChart>
              </ResponsiveChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No spending data yet
              </p>
            )}
          </article>

          {/* Catalog — glassmorphic */}
          <article
            id="catalog"
            className={cn(
              "rounded-[28px] border border-sky-400/20 dark:border-sky-400/30 p-2 sm:p-4 backdrop-blur-sm transition-all",
              "bg-white/60 dark:bg-white/5",
              "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-500/25 dark:via-sky-500/10 dark:to-sky-500/5",
              "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]",
              "hover:border-sky-300/40",
            )}
          >
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-white">
                <Store className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                Catalog — What&apos;s available
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                Browse suppliers, categories, and products
              </p>
            </div>
            <div className="space-y-4">
              {catalogLoading ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-500" />
                      Suppliers
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Products</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBodyPulseRows rows={5} columnCount={3} />
                      </Table>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-violet-500" />
                      Categories
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Product Owner</TableHead>
                            <TableHead className="text-right">Products</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBodyPulseRows rows={5} columnCount={4} />
                      </Table>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-500" />
                      Products
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Product Owner</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBodyPulseRows rows={8} columnCount={7} />
                      </Table>
                    </div>
                  </div>
                </>
              ) : catalogQuery.isError || !catalog ? (
                <p className="text-muted-foreground text-center py-4">
                  Unable to load catalog.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-500" />
                      Suppliers
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Products
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catalog.suppliers.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center text-muted-foreground py-4"
                              >
                                No suppliers
                              </TableCell>
                            </TableRow>
                          ) : (
                            catalog.suppliers.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell className="font-medium">
                                  <Link
                                    href={`/suppliers/${s.id}`}
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {s.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <CatalogStatusBadge status={s.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                  {s.productCount}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-violet-500" />
                      Categories
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Product Owner</TableHead>
                            <TableHead className="text-right">
                              Products
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catalog.categories.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground py-4"
                              >
                                No categories
                              </TableCell>
                            </TableRow>
                          ) : (
                            catalog.categories.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium">
                                  <Link
                                    href={`/categories/${c.id}`}
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {c.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <CatalogStatusBadge status={c.status} />
                                </TableCell>
                                <TableCell>
                                  {c.categoryCreatorId ? (
                                    <Link
                                      href={`/products?ownerId=${c.categoryCreatorId}`}
                                      className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                    >
                                      {c.categoryCreatorName ?? "—"}
                                    </Link>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {c.productCount}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-500" />
                      Products
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Product Owner</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catalog.products.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground py-4"
                              >
                                No products
                              </TableCell>
                            </TableRow>
                          ) : (
                            catalog.products.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium">
                                  <Link
                                    href={`/products/${p.id}`}
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {p.name}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {p.sku}
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/categories/${p.categoryId}`}
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {p.categoryName}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/suppliers/${p.supplierId}`}
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {p.supplierName}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  {p.productOwnerId ? (
                                    <Link
                                      href={`/products?ownerId=${p.productOwnerId}`}
                                      className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                    >
                                      {p.productOwnerName ?? "—"}
                                    </Link>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${p.price.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <ProductStatusBadge status={p.status} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </article>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Recent Orders — glassmorphic */}
            <article
              className={cn(
                "rounded-[28px] border border-sky-400/20 dark:border-sky-400/30 p-2 sm:p-4 backdrop-blur-sm transition-all",
                "bg-white/60 dark:bg-white/5",
                "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-500/25 dark:via-sky-500/10 dark:to-sky-500/5",
                "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]",
                "hover:border-sky-300/40",
              )}
            >
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-white">
                  <ShoppingCart className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                  Your latest orders
                </p>
              </div>
              <div>
                {dashboardLoading ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBodyPulseRows rows={5} columnCount={3} />
                  </Table>
                ) : (dashboard?.recentOrders.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No orders yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard!.recentOrders.slice(0, 5).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Link
                                href={`/orders/${order.id}`}
                                className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                              >
                                {order.orderNumber}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {order.itemCount} items
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              ${order.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {getOrderStatusBadge(order.status)}
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
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href="/orders">View All Orders</Link>
                  </Button>
                </div>
              </div>
            </article>

            {/* Recent Invoices — glassmorphic */}
            <article
              className={cn(
                "rounded-[28px] border border-violet-400/20 dark:border-violet-400/30 p-2 sm:p-4 backdrop-blur-sm transition-all",
                "bg-white/60 dark:bg-white/5",
                "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent dark:from-violet-500/25 dark:via-violet-500/10 dark:to-violet-500/5",
                "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]",
                "hover:border-violet-300/40",
              )}
            >
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-white">
                  <FileText className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                  Recent Invoices
                </h3>
                <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                  Your latest invoices
                </p>
              </div>
              <div>
                {dashboardLoading ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBodyPulseRows rows={5} columnCount={3} />
                  </Table>
                ) : (dashboard?.recentInvoices.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No invoices yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead className="text-right">Due</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard!.recentInvoices.slice(0, 5).map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <Link
                                href={`/invoices/${invoice.id}`}
                                className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                              >
                                {invoice.invoiceNumber}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                Total: ${invoice.total.toFixed(2)}
                              </p>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${invoice.amountDue.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {getInvoiceStatusBadge(invoice.status)}
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
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href="/invoices">View All Invoices</Link>
                  </Button>
                </div>
              </div>
            </article>
          </div>

          {/* Quick Links — glassmorphic */}
          <article
            className={cn(
              "rounded-[28px] border border-violet-400/20 dark:border-violet-400/30 p-2 sm:p-4 backdrop-blur-sm transition-all",
              "bg-white/60 dark:bg-white/5",
              "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent dark:from-violet-500/25 dark:via-violet-500/10 dark:to-violet-500/5",
              "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]",
              "hover:border-violet-300/40",
            )}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">
              Quick Links
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/orders">
                  <ShoppingCart className="h-4 w-4" />
                  My Orders
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/invoices">
                  <FileText className="h-4 w-4" />
                  My Invoices
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/products">
                  <Package className="h-4 w-4" />
                  Browse Products
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/">
                  <TrendingUp className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </article>
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
