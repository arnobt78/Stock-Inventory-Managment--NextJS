"use client";

/**
 * Client Portal Page
 * Dashboard for clients to view their orders, invoices, and spending
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
  Clock,
  Package,
  Store,
  Layers,
  Boxes,
  ArrowRight,
  TrendingUp,
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
  AvatarInlineLink,
  CopyableText,
  PageContentWrapper,
  DataSlotPulse,
  SectionCardHeader,
  PageSectionHeader,
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  ClientCompactDateTime,
  SectionTitleRow,
} from "@/components/shared";
import {
  CARD_LIST_DIVIDE_CLASS,
  CARD_LIST_META_CLASS,
  CARD_LIST_ROW_CLASS,
} from "@/lib/ui/card-list-styles";
import {
  ActiveInactiveBadge,
  InvoiceStatusBadge,
  OrderStatusBadge,
  ProductStockStatusBadge,
} from "@/lib/ui/semantic-badges";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { cn } from "@/lib/utils";
import { PAGE_STATS_GRID_CLASS, PAGE_SECTION_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import { createChartDotLabelRenderer, CHART_LABEL_TOP_MARGIN } from "@/lib/ui/chart-point-label";
import type { ClientPortalDashboard, ClientCatalogOverview } from "@/types";
import type { LucideIcon } from "lucide-react";

/** REQ-0077/0078/0079/0080 — catalog subsection title + slate glass count badge */
function CatalogSubsectionTitle({
  icon,
  iconClassName,
  label,
  count,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="mb-2">
      <SectionTitleRow
        title={label}
        as="span"
        icon={icon}
        iconClassName={iconClassName}
        count={count}
      />
    </div>
  );
}

/** Normalize catalog product status label → semantic badge key */
function productStatusKey(status: string): string {
  const n = (status || "").toLowerCase().replace(/\s+/g, "_");
  if (n === "stock_low" || n === "low_stock") return "stock_low";
  if (n === "stock_out" || n === "out_of_stock") return "stock_out";
  return "available";
}

export type ClientPortalPageProps = {
  /** REQ-0025 — SSR-passed client dashboard */
  initialDashboard?: ClientPortalDashboard;
  /** REQ-0026 — SSR catalog overview */
  initialCatalog?: ClientCatalogOverview;
};

export default function ClientPortalPage({
  initialDashboard,
  initialCatalog,
}: ClientPortalPageProps = {}) {
  const { isCheckingAuth, user } = useAuth();
  const dashboardQuery = useClientPortalDashboard(initialDashboard);
  const catalogQuery = useClientCatalogOverview(initialCatalog);

  useSyncSsrQueryData(
    [...queryKeys.portal.client(), user?.id ?? ""],
    user?.id && initialDashboard !== undefined ? initialDashboard : undefined,
  );
  useSyncSsrQueryData(
    [...queryKeys.portal.clientCatalog(), user?.id ?? ""],
    user?.id && initialCatalog !== undefined ? initialCatalog : undefined,
  );

  const dashboard = dashboardQuery.data ?? initialDashboard;
  const catalog = catalogQuery.data ?? initialCatalog;
  const dashboardLoading = isDataSlotLoading(dashboardQuery, initialDashboard);
  const catalogLoading = isDataSlotLoading(catalogQuery, initialCatalog);
  const showError =
    !dashboardLoading &&
    !isCheckingAuth &&
    (dashboardQuery.isError || !dashboard);

  if (showError) {
    return (
      <Navbar>
        <PageContentWrapper>
          <div className="space-y-4">
            <h1 className="text-sm sm:text-lg font-medium text-primary">
              Client Portal
            </h1>
            <article
              className={cn(
                "rounded-[28px] border border-white/10 dark:border-white/20 p-2 sm:p-4 backdrop-blur-md bg-white/60 dark:bg-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_80px_rgba(255,255,255,0.08)]",
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
        <div className="flex flex-col">
          <PageSectionHeader
            as="h1"
            icon={Store}
            tone="sky"
            title="Client Portal"
            description={
              <>
                Welcome,{" "}
                {dashboardLoading ? (
                  <DataSlotPulse variant="text-sm" />
                ) : (
                  dashboard?.clientName
                )}
              </>
            }
          />

          {/* Summary Cards — admin-aligned pb-6 rhythm (REQ-0074) */}
          <div className={cn(PAGE_STATS_GRID_CLASS, "grid-cols-1 sm:grid-cols-2 md:grid-cols-4")}>
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
              value={`$${(dashboard?.totalSpent ?? 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}`}
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
                          (dashboard?.totalSpent ?? 0) /
                          (dashboard?.totalOrders ?? 1)
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
              value={`$${(dashboard?.outstandingAmount ?? 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}`}
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

          <div className={PAGE_SECTION_SPACING_CLASS}>
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
              title="Monthly Spending"
              description="Your spending over the last 6 months (grouped by month)"
            />
            <DeferredChartSection
              loading={dashboardLoading}
              hasData={(dashboard?.monthlySpending.length ?? 0) > 0}
              emptyMessage={
                <p className="text-muted-foreground text-center py-8">
                  No spending data yet
                </p>
              }
            >
              <ResponsiveChartContainer>
                <AreaChart
                  data={dashboard!.monthlySpending}
                  margin={{ top: CHART_LABEL_TOP_MARGIN, right: 30, left: 0, bottom: 0 }}
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
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    label={createChartDotLabelRenderer(
                      dashboard!.monthlySpending.length,
                    )}
                  />
                </AreaChart>
              </ResponsiveChartContainer>
            </DeferredChartSection>
          </article>
          </div>

          {/* Catalog — glassmorphic */}
          <div className={PAGE_SECTION_SPACING_CLASS}>
          <article
            id="catalog"
            className={cn(
              "rounded-[28px] border border-sky-400/20 dark:border-sky-400/30 p-2 sm:p-4 backdrop-blur-md transition-all",
              "bg-white/60 dark:bg-white/5",
              "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-500/25 dark:via-sky-500/10 dark:to-sky-500/5",
              "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]",
              "hover:border-sky-300/40",
            )}
          >
            <SectionCardHeader
              className="mb-6"
              icon={Store}
              tone="sky"
              title="Catalog — What's available"
              description="Browse suppliers, categories, and products"
            />
            <div className="space-y-4">
              {catalogLoading ? (
                <>
                  <div>
                    <CatalogSubsectionTitle
                      icon={Layers}
                      iconClassName="text-sky-500"
                      label="Suppliers"
                    />
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
                        <TableBodyPulseRows rows={5} columnCount={3} />
                      </Table>
                    </div>
                  </div>
                  <div>
                    <CatalogSubsectionTitle
                      icon={Boxes}
                      iconClassName="text-violet-500"
                      label="Categories"
                    />
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
                        <TableBodyPulseRows rows={5} columnCount={4} />
                      </Table>
                    </div>
                  </div>
                  <div>
                    <CatalogSubsectionTitle
                      icon={Package}
                      iconClassName="text-emerald-500"
                      label="Products"
                    />
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
                    <CatalogSubsectionTitle
                      icon={Layers}
                      iconClassName="text-sky-500"
                      label="Suppliers"
                      count={catalog.meta?.totalSuppliers ?? catalog.suppliers.length}
                    />
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
                                <TableCell className="font-normal">
                                  <AvatarInlineLink
                                    seed={s.id}
                                    label={s.name}
                                    href={`/suppliers/${s.id}`}
                                    linkClassName="font-normal"
                                  />
                                </TableCell>
                                <TableCell>
                                  <ActiveInactiveBadge
                                    active={s.status === "Active"}
                                  />
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
                    <CatalogSubsectionTitle
                      icon={Boxes}
                      iconClassName="text-violet-500"
                      label="Categories"
                      count={catalog.meta?.totalCategories ?? catalog.categories.length}
                    />
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
                                <TableCell className="font-normal">
                                  <Link
                                    href={`/categories/${c.id}`}
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {c.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <ActiveInactiveBadge
                                    active={c.status === "Active"}
                                  />
                                </TableCell>
                                <TableCell>
                                  {c.categoryCreatorId ? (
                                    <AvatarInlineLink
                                      seed={c.categoryCreatorId}
                                      label={c.categoryCreatorName ?? "—"}
                                      href={`/products?ownerId=${c.categoryCreatorId}`}
                                      linkClassName="font-normal"
                                    />
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
                    <CatalogSubsectionTitle
                      icon={Package}
                      iconClassName="text-emerald-500"
                      label="Products"
                      count={catalog.meta?.totalProducts ?? catalog.products.length}
                    />
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
                                <TableCell className="font-normal">
                                  <Link
                                    href={`/products/${p.id}`}
                                    prefetch
                                    className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                  >
                                    {p.name}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  <CopyableText value={p.sku}>{p.sku}</CopyableText>
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
                                  <AvatarInlineLink
                                    seed={p.supplierId}
                                    label={p.supplierName}
                                    href={`/suppliers/${p.supplierId}`}
                                    linkClassName="font-normal"
                                  />
                                </TableCell>
                                <TableCell>
                                  {p.productOwnerId ? (
                                    <AvatarInlineLink
                                      seed={p.productOwnerId}
                                      image={p.productOwnerImage}
                                      label={p.productOwnerName ?? "—"}
                                      href={`/products?ownerId=${p.productOwnerId}`}
                                      linkClassName="font-normal"
                                    />
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${p.price.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <ProductStockStatusBadge
                                    status={productStatusKey(p.status)}
                                    label={p.status || "—"}
                                  />
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
          </div>

          <div className={PAGE_SECTION_SPACING_CLASS}>
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
                description="Your latest orders"
              />
              <div>
                {dashboardLoading ? (
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
                          <CopyableText value={order.orderNumber} className="max-w-full">
                            <Link
                              href={`/orders/${order.id}`}
                              prefetch
                              className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                            >
                              {order.orderNumber}
                            </Link>
                          </CopyableText>
                          <span className={CARD_LIST_META_CLASS}>
                            {order.itemCount} items ·{" "}
                            <ClientCompactDateTime date={order.createdAt} />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 overflow-visible py-1">
                          <OrderStatusBadge status={order.status} />
                          <span className="text-xs font-normal text-gray-700 dark:text-white">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
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

            {/* Recent Invoices — glassmorphic */}
            <article
              className={cn(
                "rounded-[28px] border border-violet-400/20 dark:border-violet-400/30 p-2 sm:p-4 backdrop-blur-md transition-all",
                "bg-white/60 dark:bg-white/5",
                "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent dark:from-violet-500/25 dark:via-violet-500/10 dark:to-violet-500/5",
                "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]",
                "hover:border-violet-300/40",
              )}
            >
              <SectionCardHeader
                className="mb-4"
                icon={FileText}
                tone="violet"
                title="Recent Invoices"
                description="Your latest invoices"
              />
              <div>
                {dashboardLoading ? (
                  <ul className="space-y-3 py-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <DataSlotPulse variant="text-sm" className="w-32" />
                        <DataSlotPulse variant="badge" />
                      </li>
                    ))}
                  </ul>
                ) : (dashboard?.recentInvoices.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No invoices yet
                  </p>
                ) : (
                  <ul className={CARD_LIST_DIVIDE_CLASS}>
                    {dashboard!.recentInvoices.slice(0, 5).map((invoice) => (
                      <li key={invoice.id} className={CARD_LIST_ROW_CLASS}>
                        <div className="min-w-0">
                          <CopyableText value={invoice.invoiceNumber} className="max-w-full">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              prefetch
                              className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </CopyableText>
                          <span className={CARD_LIST_META_CLASS}>
                            Total ${invoice.total.toFixed(2)}
                            {invoice.dueDate && (
                              <>
                                {" · Due "}
                                <ClientCompactDateTime date={invoice.dueDate} />
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 overflow-visible py-1">
                          <InvoiceStatusBadge status={invoice.status} />
                          <span className="text-xs font-normal text-gray-700 dark:text-white">
                            ${invoice.amountDue.toFixed(2)} due
                          </span>
                        </div>
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
                      GLASS_ACTION_BUTTON.violet,
                    )}
                  >
                    <Link href="/invoices">
                      <ArrowRight className="h-4 w-4 shrink-0" />
                      View All Invoices
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
