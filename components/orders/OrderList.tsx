/**
 * Order List Component
 * Main component for displaying and managing orders
 */

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { OrderTable } from "./OrderTable";
import { createOrderColumns } from "./OrderTableColumns";
import { useAuth } from "@/contexts";
import {
  useOrders,
  useClientOrders,
  useDashboard,
  useClientPortalDashboard,
  useSupplierPortalDashboard,
} from "@/hooks/queries";
import {
  isDataSlotLoading,
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { buildStoreOrderStatusBadges } from "@/lib/ui/store-order-status-badges";
import { buildStoreInvoiceStatusBadges } from "@/lib/ui/store-invoice-status-badges";
import { buildPortalOrderStatusBadges } from "@/lib/ui/portal-order-status-badges";
import OrderFilters from "./OrderFilters";
import OrderDialog from "./OrderDialog";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import {
  DollarSign,
  CreditCard,
  ShoppingCart,
  FileText,
  Clock,
  Package,
} from "lucide-react";
import { PageSectionHeader } from "@/components/shared";
import type { Order } from "@/types";
import type { OrderForPage } from "@/lib/server/orders-data";
import type { OrderWithSource } from "./OrderTableColumns";
import type { OrderSourceFilterValue } from "./OrderSourceFilter";
import type {
  DashboardStats,
  ClientPortalDashboard,
  SupplierPortalDashboard,
} from "@/types";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Customer display: shipping name/email, or placedByName when missing (e.g. Google one-click) */
function getCustomerDisplay(order: Order): string {
  const addr = order.shippingAddress as
    { name?: string; email?: string } | null | undefined;
  if (addr?.name) return addr.name;
  if (addr?.email) return addr.email;
  if (order.placedByName) return order.placedByName;
  return "—";
}

export type OrderListProps = {
  /** When set (e.g. "/admin/orders"), View/Order # links use {detailHrefBase}/{id} */
  detailHrefBase?: string;
  /** When "clientOrders", fetches client orders; when "adminCombined", merge personal + client with Order type filter */
  dataSource?: "orders" | "clientOrders" | "adminCombined";
  /** SSR-passed orders for first-render hydration (REQ-0021) */
  initialOrders?: Order[] | OrderForPage[];
  /** SSR client-leg orders for adminCombined (REQ-0025) */
  initialClientOrders?: Order[] | OrderForPage[];
  /** SSR dashboard stats for header cards (REQ-0025) */
  initialStats?: DashboardStats | null;
  /** SSR client portal for client /orders cards */
  initialClientPortal?: ClientPortalDashboard;
  /** SSR supplier portal for supplier /orders cards */
  initialSupplierPortal?: SupplierPortalDashboard | null;
};

const OrderList = React.memo(
  ({
    detailHrefBase,
    dataSource = "orders",
    initialOrders,
    initialClientOrders,
    initialStats,
    initialClientPortal,
    initialSupplierPortal,
  }: OrderListProps = {}) => {
    // Track if component has mounted on client to prevent hydration mismatch
    const isMountedRef = useRef(false);
    const [isMounted, setIsMounted] = useState(false);

    const pathname = usePathname();
    const { user } = useAuth();
    const role = user?.role;

    const enableClientOrders =
      dataSource === "clientOrders" || dataSource === "adminCombined";
    const enableDashboard =
      (pathname === "/orders" && role !== "client" && role !== "supplier") ||
      dataSource === "adminCombined";
    const enableClientPortal = pathname === "/orders" && role === "client";
    const enableSupplierPortal = pathname === "/orders" && role === "supplier";

    const ordersQueryDefault = useOrders(
      dataSource === "orders" || dataSource === "adminCombined"
        ? initialOrders
        : undefined,
    );
    const ordersQueryClient = useClientOrders(
      dataSource === "clientOrders" || dataSource === "adminCombined"
        ? (initialClientOrders as Order[] | undefined)
        : undefined,
      { enabled: enableClientOrders },
    );
    const dashboardQuery = useDashboard(initialStats ?? undefined, {
      enabled: enableDashboard,
    });
    const dashboard =
      dataSource === "adminCombined" ? (dashboardQuery.data ?? null) : null;
    /** Show store-wide state cards only for admin/user on /orders (not for client/supplier) */
    const isUserOrdersPage =
      pathname === "/orders" &&
      user?.role !== "client" &&
      user?.role !== "supplier";
    /** Client on /orders: show client-specific order state cards (same data as /client portal) */
    const isClientOrdersPage =
      pathname === "/orders" && user?.role === "client";
    /** Supplier on /orders: show supplier-specific header and state cards */
    const isSupplierOrdersPage =
      pathname === "/orders" && user?.role === "supplier";
    const portalDashboardQuery = useClientPortalDashboard(
      enableClientPortal ? initialClientPortal : undefined,
    );
    const supplierPortalQuery = useSupplierPortalDashboard(
      enableSupplierPortal ? (initialSupplierPortal ?? undefined) : undefined,
    );
    const clientPortalDashboard = isClientOrdersPage
      ? (portalDashboardQuery.data ?? null)
      : null;
    const ordersPageStats = isUserOrdersPage
      ? (dashboardQuery.data ?? null)
      : null;
    const ordersQuery =
      dataSource === "clientOrders" ? ordersQueryClient : ordersQueryDefault;

    useSyncSsrQueryData(
      queryKeys.orders.lists(),
      dataSource === "orders" || dataSource === "adminCombined"
        ? initialOrders
        : undefined,
    );
    useSyncSsrQueryData(
      queryKeys.clientOrders.lists(),
      enableClientOrders ? initialClientOrders : undefined,
    );
    useSyncSsrQueryData(
      queryKeys.dashboard.overview(user?.id ?? ""),
      enableDashboard && user?.id && initialStats != null
        ? initialStats
        : undefined,
    );
    useSyncSsrQueryData(
      queryKeys.clientPortal.overview(),
      enableClientPortal ? initialClientPortal : undefined,
    );
    useSyncSsrQueryData(
      queryKeys.supplierPortal.overview(),
      enableSupplierPortal ? initialSupplierPortal : undefined,
    );

    const effectiveDetailBase =
      dataSource === "clientOrders"
        ? "/admin/client-orders"
        : dataSource === "adminCombined"
          ? "/admin/orders"
          : detailHrefBase;

    const [orderSourceFilter, setOrderSourceFilter] =
      useState<OrderSourceFilterValue>("both");

    const mergedOrdersForAdmin = useMemo((): OrderWithSource[] => {
      if (dataSource !== "adminCombined" || !user) return [];
      const personal = ordersQueryDefault.data ?? [];
      const client = ordersQueryClient.data ?? [];
      const byId = new Map<string, OrderWithSource>();
      client.forEach((o) => {
        byId.set(o.id, {
          ...o,
          _source: "client",
          _displayName: getCustomerDisplay(o),
        });
      });
      personal.forEach((o) => {
        const isSelf = o.userId === user.id;
        byId.set(o.id, {
          ...o,
          _source: isSelf ? "personal" : "client",
          _displayName: isSelf ? (user.name ?? "You") : getCustomerDisplay(o),
        });
      });
      return Array.from(byId.values());
    }, [dataSource, user, ordersQueryDefault.data, ordersQueryClient.data]);

    const allOrdersRaw =
      dataSource === "adminCombined"
        ? mergedOrdersForAdmin
        : (ordersQuery.data ?? []);
    const allOrders = useMemo(() => {
      if (dataSource !== "adminCombined") return allOrdersRaw;
      if (orderSourceFilter === "both") return allOrdersRaw;
      return (allOrdersRaw as OrderWithSource[]).filter(
        (o) => o._source === orderSourceFilter,
      );
    }, [dataSource, orderSourceFilter, allOrdersRaw]);

    // Mark component as mounted after client-side hydration
    useEffect(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        queueMicrotask(() => setIsMounted(true));
      }
    }, []);

    // State for column filters, search term, and pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationType>({
      pageIndex: 0,
      pageSize: 8,
    });

    // State for selected filters
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<
      string[]
    >([]);

    // State for controlling edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    // REQ-0061: "Create Invoice" from an order row opens InvoiceDialog pre-selected
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [invoiceOrderId, setInvoiceOrderId] = useState<string>("");

    // Create table columns with edit handler
    const handleEditOrder = useCallback((order: Order) => {
      setEditingOrder(order);
      setEditDialogOpen(true);
    }, []);

    const handleCreateInvoiceForOrder = useCallback((order: Order) => {
      setInvoiceOrderId(order.id);
      setInvoiceDialogOpen(true);
    }, []);

    const columns = useMemo(
      () =>
        createOrderColumns(handleEditOrder, effectiveDetailBase, {
          showSourceBadge: dataSource === "adminCombined",
          showPlacedBy: isSupplierOrdersPage,
          showProductOwner: isClientOrdersPage,
          onCreateInvoice: handleCreateInvoiceForOrder,
        }),
      [
        handleEditOrder,
        effectiveDetailBase,
        dataSource,
        isSupplierOrdersPage,
        isClientOrdersPage,
        handleCreateInvoiceForOrder,
      ],
    );

    // REQ-0021: shell-first — only data slots pulse
    const tableDataLoading =
      dataSource === "adminCombined"
        ? isDataSlotLoading(ordersQueryDefault, initialOrders) ||
          (enableClientOrders
            ? isDataSlotLoading(ordersQueryClient, initialClientOrders)
            : false)
        : dataSource === "clientOrders"
          ? isDataSlotLoading(ordersQueryClient, initialClientOrders)
          : isDataSlotLoading(ordersQuery, initialOrders);
    const dashboardCardsLoading = enableDashboard
      ? isDataSlotUnsettled(dashboardQuery, initialStats ?? undefined)
      : false;
    const clientPortalCardsLoading = enableClientPortal
      ? isDataSlotUnsettled(portalDashboardQuery, initialClientPortal)
      : false;
    const supplierPortalCardsLoading = enableSupplierPortal
      ? isDataSlotUnsettled(
          supplierPortalQuery,
          initialSupplierPortal ?? undefined,
        )
      : false;
    const supplierPortal = supplierPortalQuery.data;
    const supplierNonCancelledOrders = Math.max(
      0,
      (supplierPortal?.totalOrders ?? 0) -
        (supplierPortal?.orderStatusCounts?.cancelled ?? 0),
    );
    const supplierAvgOrder =
      supplierNonCancelledOrders > 0
        ? (supplierPortal?.totalRevenue ?? 0) / supplierNonCancelledOrders
        : 0;

    const isClientOrders = dataSource === "clientOrders";
    const isAdminCombined = dataSource === "adminCombined";

    // Always render the UI structure to prevent flashing
    // Only the table will show skeleton during initial load
    return (
      <div className="flex flex-col poppins">
        {/* Order Management Section Header */}
        <PageSectionHeader
          as="h2"
          icon={ShoppingCart}
          tone="sky"
          title={
            isAdminCombined
              ? "Store Orders Management (self + client)"
              : isClientOrders
                ? "Client Orders"
                : isClientOrdersPage
                  ? "Your Orders"
                  : isSupplierOrdersPage
                    ? "Orders (Your Products)"
                    : "Order Management"
          }
          description={
            isAdminCombined
              ? "Orders placed by you and by clients. Filter by order type, status, and payment."
              : isClientOrders
                ? "Orders placed by clients that include your products. View details, update status, and manage shipping."
                : isClientOrdersPage
                  ? "View and track all your orders here. Check status, payment, and shipping—open an order for full details."
                  : isSupplierOrdersPage
                    ? "Orders that contain your products. Track status, payments, and invoices created by the product owner."
                    : "Manage client orders, track order status, monitor payments, and handle shipping. View order history, update statuses, and process cancellations."
          }
        />

        {/* Store-wide state cards — only on /orders page (user), same as homepage */}
        {isUserOrdersPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
            <StatisticsCard
              title="Total Value"
              value={formatCurrency(ordersPageStats?.totalInventoryValue ?? 0)}
              description="Total inventory value"
              icon={DollarSign}
              variant="violet"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={[
                {
                  label: "Orders",
                  value: formatCurrency(
                    ordersPageStats?.orderAnalytics
                      ?.totalRevenueExcludingCancelled ??
                      ordersPageStats?.revenue?.fromOrders ??
                      0,
                  ),
                },
                {
                  label: "Invoices",
                  value: formatCurrency(
                    ordersPageStats?.revenue?.fromInvoices ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    ordersPageStats?.invoiceAnalytics?.outstandingAmount ?? 0,
                  ),
                },
                {
                  label: "Cancelled",
                  value: formatCurrency(
                    ordersPageStats?.orderAnalytics?.cancelledOrderAmount ?? 0,
                  ),
                },
              ]}
            />
            <StatisticsCard
              title="Total Revenue"
              value={formatCurrency(
                ordersPageStats?.orderAnalytics
                  ?.totalRevenueExcludingCancelled ??
                  ordersPageStats?.revenue?.fromOrders ??
                  0,
              )}
              description="Profits (excl. cancelled)"
              icon={DollarSign}
              variant="emerald"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value: formatCurrency(
                    ordersPageStats?.orderAnalytics?.paidOrderAmount ?? 0,
                  ),
                },
                {
                  label: "Partial",
                  value: formatCurrency(
                    ordersPageStats?.orderAnalytics?.partialOrderAmount ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    ordersPageStats?.invoiceAnalytics?.outstandingAmount ?? 0,
                  ),
                },
                {
                  label: "Refund",
                  value: formatCurrency(
                    ordersPageStats?.orderAnalytics?.refundedAmount ?? 0,
                  ),
                },
                {
                  label: "Pending",
                  value: formatCurrency(
                    ordersPageStats?.orderAnalytics?.pendingOrderAmount ?? 0,
                  ),
                },
                ...(ordersPageStats?.selfOthersBreakdown
                  ? [
                      {
                        label: "Self",
                        value: formatCurrency(
                          ordersPageStats?.selfOthersBreakdown.revenueSelf,
                        ),
                      },
                      {
                        label: "Others",
                        value: formatCurrency(
                          ordersPageStats?.selfOthersBreakdown.revenueOthers,
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            <StatisticsCard
              title="Total Orders"
              value={ordersPageStats?.counts.orders}
              description="Total orders placed (self + client)"
              icon={ShoppingCart}
              variant="blue"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={buildStoreOrderStatusBadges({
                statusDistribution:
                  ordersPageStats?.orderAnalytics?.statusDistribution,
                refundedCount: ordersPageStats?.orderAnalytics?.refundedCount,
                selfOthers: ordersPageStats?.selfOthersBreakdown
                  ? {
                      orderSelfCount:
                        ordersPageStats.selfOthersBreakdown.orderSelfCount,
                      orderOthersCount:
                        ordersPageStats.selfOthersBreakdown.orderOthersCount,
                    }
                  : null,
              })}
            />
            <StatisticsCard
              title="Invoices"
              value={ordersPageStats?.counts.invoices}
              description="Total invoices (store-wide)"
              icon={FileText}
              variant="sky"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={buildStoreInvoiceStatusBadges({
                paidCount:
                  ordersPageStats?.invoiceAnalytics?.statusDistribution?.paid,
                partialCount: ordersPageStats?.invoiceAnalytics?.partialCount,
                pendingCount:
                  ordersPageStats?.invoiceAnalytics?.pendingCount ??
                  (ordersPageStats?.invoiceAnalytics?.statusDistribution
                    ?.draft ?? 0) +
                    (ordersPageStats?.invoiceAnalytics?.statusDistribution
                      ?.sent ?? 0),
                overdueCount:
                  ordersPageStats?.invoiceAnalytics?.statusDistribution
                    ?.overdue,
                cancelledCount:
                  ordersPageStats?.invoiceAnalytics?.statusDistribution
                    ?.cancelled,
                refundedCount: ordersPageStats?.orderAnalytics?.refundedCount,
                selfOthers: ordersPageStats?.selfOthersBreakdown
                  ? {
                      invoiceSelfCount:
                        ordersPageStats.selfOthersBreakdown.invoiceSelfCount,
                      invoiceOthersCount:
                        ordersPageStats.selfOthersBreakdown.invoiceOthersCount,
                    }
                  : null,
              })}
            />
          </div>
        )}

        {/* Client order state cards — /orders as client (same data as /client portal) */}
        {isClientOrdersPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
            <StatisticsCard
              title="Total Orders"
              value={clientPortalDashboard?.totalOrders ?? 0}
              description="Your order history"
              icon={ShoppingCart}
              variant="sky"
              valueLoading={clientPortalCardsLoading}
              badgeValuesLoading={clientPortalCardsLoading}
              badges={buildPortalOrderStatusBadges({
                pending: clientPortalDashboard?.orderStatusCounts?.pending,
                inProgress:
                  clientPortalDashboard?.orderStatusCounts?.inProgress,
                shipped: clientPortalDashboard?.orderStatusCounts?.shipped,
                delivered: clientPortalDashboard?.orderStatusCounts?.delivered,
                refundedCount: clientPortalDashboard?.refundedOrdersCount ?? 0,
              })}
            />
            <StatisticsCard
              title="Awaiting Payment"
              value={clientPortalDashboard?.ordersAwaitingPayment ?? 0}
              description="Orders awaiting payment"
              icon={Clock}
              variant="amber"
              valueLoading={clientPortalCardsLoading}
              badgeValuesLoading={clientPortalCardsLoading}
              badges={[
                {
                  label: "Cancelled",
                  value:
                    clientPortalDashboard?.orderStatusCounts?.cancelled ?? 0,
                },
                {
                  label: "Completed",
                  value: clientPortalDashboard?.ordersCompleted ?? 0,
                },
                {
                  label: "Refunded",
                  value: clientPortalDashboard?.refundedOrdersCount ?? 0,
                },
                {
                  label: "Of Total",
                  value: clientPortalDashboard?.totalOrders,
                },
              ]}
            />
            <StatisticsCard
              title="Total Spent"
              value={formatCurrency(clientPortalDashboard?.totalSpent ?? 0)}
              description="Total order value"
              icon={DollarSign}
              variant="emerald"
              valueLoading={clientPortalCardsLoading}
              badgeValuesLoading={clientPortalCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.paid ?? 0,
                  ),
                },
                {
                  label: "Partial",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.partial ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.due ?? 0,
                  ),
                },
                {
                  label: "Refund",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.refund ?? 0,
                  ),
                },
                {
                  label: "Pending",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.pending ?? 0,
                  ),
                },
                {
                  label: "Cancelled",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.cancelled ?? 0,
                  ),
                },
              ]}
            />
            <StatisticsCard
              title="Average Order Value"
              value={formatCurrency(
                (clientPortalDashboard?.totalOrders ?? 0) > 0
                  ? (clientPortalDashboard?.totalSpent ?? 0) /
                      (clientPortalDashboard?.totalOrders ?? 1)
                  : 0,
              )}
              description="Per order average"
              icon={CreditCard}
              variant="violet"
              valueLoading={clientPortalCardsLoading}
              badgeValuesLoading={clientPortalCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.paid ?? 0,
                  ),
                },
                {
                  label: "Partial",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.partial ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    clientPortalDashboard?.paymentBreakdown?.due ?? 0,
                  ),
                },
                ...(clientPortalDashboard?.outstandingAmount === 0
                  ? [{ label: "Status", value: "All Paid" as string }]
                  : []),
                {
                  label: "Total Invoices",
                  value: clientPortalDashboard?.invoiceBreakdown?.total ?? 0,
                },
              ]}
            />
          </div>
        )}

        {/* Supplier /orders state cards — 4 cards, supplier portal data */}
        {isSupplierOrdersPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
            <StatisticsCard
              title="Total Products"
              value={supplierPortal?.totalProducts ?? 0}
              description="Products in your catalog"
              icon={Package}
              variant="rose"
              valueLoading={supplierPortalCardsLoading}
              badgeValuesLoading={supplierPortalCardsLoading}
              badges={[
                {
                  label: "Available",
                  value: supplierPortal?.productStatusCounts?.available ?? 0,
                },
                {
                  label: "Stock low",
                  value: supplierPortal?.productStatusCounts?.stockLow ?? 0,
                },
                {
                  label: "Stock out",
                  value: supplierPortal?.productStatusCounts?.stockOut ?? 0,
                },
                {
                  label: "Product value",
                  value: formatCurrency(supplierPortal?.productValue ?? 0),
                },
                {
                  label: "Orders",
                  value: formatCurrency(
                    supplierPortal?.valueBreakdown?.orders ?? 0,
                  ),
                },
                {
                  label: "Invoices",
                  value: formatCurrency(
                    supplierPortal?.valueBreakdown?.invoices ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    supplierPortal?.valueBreakdown?.due ?? 0,
                  ),
                },
                {
                  label: "Cancelled",
                  value: formatCurrency(
                    supplierPortal?.valueBreakdown?.cancelled ?? 0,
                  ),
                },
                {
                  label: "Refunded",
                  value: formatCurrency(
                    supplierPortal?.valueBreakdown?.refunded ?? 0,
                  ),
                },
              ]}
            />
            <StatisticsCard
              title="Total Orders"
              value={supplierPortal?.totalOrders ?? 0}
              description="Orders containing your products"
              icon={ShoppingCart}
              variant="emerald"
              valueLoading={supplierPortalCardsLoading}
              badgeValuesLoading={supplierPortalCardsLoading}
              badges={buildPortalOrderStatusBadges({
                pending: supplierPortal?.orderStatusCounts?.pending,
                inProgress: supplierPortal?.orderStatusCounts?.inProgress,
                shipped: supplierPortal?.orderStatusCounts?.shipped,
                delivered: supplierPortal?.orderStatusCounts?.delivered,
                refundedCount: supplierPortal?.orderStatusCounts?.refunded ?? 0,
                cancelledCount:
                  supplierPortal?.orderStatusCounts?.cancelled ?? 0,
              })}
            />
            <StatisticsCard
              title="Total Revenue"
              value={formatCurrency(supplierPortal?.totalRevenue ?? 0)}
              description="Revenue from your products (excl. cancelled)"
              icon={DollarSign}
              variant="amber"
              valueLoading={supplierPortalCardsLoading}
              badgeValuesLoading={supplierPortalCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value: formatCurrency(
                    supplierPortal?.revenueBreakdown?.paid ?? 0,
                  ),
                },
                {
                  label: "Partial",
                  value: formatCurrency(
                    supplierPortal?.revenueBreakdown?.partial ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    supplierPortal?.revenueBreakdown?.due ?? 0,
                  ),
                },
                {
                  label: "Refund",
                  value: formatCurrency(
                    supplierPortal?.revenueBreakdown?.refund ?? 0,
                  ),
                },
                {
                  label: "Pending",
                  value: formatCurrency(
                    supplierPortal?.revenueBreakdown?.pending ?? 0,
                  ),
                },
                { label: "Avg/Order", value: formatCurrency(supplierAvgOrder) },
              ]}
            />
            <StatisticsCard
              title="Total Invoices"
              value={supplierPortal?.totalInvoices ?? 0}
              description="Invoices created by product owner"
              icon={FileText}
              variant="sky"
              valueLoading={supplierPortalCardsLoading}
              badgeValuesLoading={supplierPortalCardsLoading}
              badges={buildStoreInvoiceStatusBadges({
                paidCount: supplierPortal?.invoiceBreakdown?.paid,
                partialCount: supplierPortal?.invoiceBreakdown?.partial,
                pendingCount: supplierPortal?.invoiceBreakdown?.pending,
                overdueCount: supplierPortal?.invoiceBreakdown?.overdue,
                cancelledCount: supplierPortal?.invoiceBreakdown?.cancelled,
                refundedCount: supplierPortal?.invoiceBreakdown?.refunded,
              })}
            />
          </div>
        )}

        {/* Summary cards — admin combined only (4 cards, 2 per row); same as dashboard/products */}
        {isAdminCombined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 pb-6 items-stretch">
            <StatisticsCard
              title="Total Orders"
              value={dashboard?.counts?.orders ?? 0}
              description="Total orders placed (self + client)"
              icon={ShoppingCart}
              variant="blue"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={buildStoreOrderStatusBadges({
                statusDistribution:
                  dashboard?.orderAnalytics?.statusDistribution,
                refundedCount: dashboard?.orderAnalytics?.refundedCount,
              })}
            />
            <StatisticsCard
              title="Total Revenue"
              value={formatCurrency(
                dashboard?.orderAnalytics?.totalRevenueExcludingCancelled ??
                  dashboard?.revenue?.fromOrders ??
                  0,
              )}
              description="Revenue (excl. cancelled)"
              icon={CreditCard}
              variant="amber"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value: formatCurrency(
                    dashboard?.orderAnalytics?.paidOrderAmount ?? 0,
                  ),
                },
                {
                  label: "Partial",
                  value: formatCurrency(
                    dashboard?.orderAnalytics?.partialOrderAmount ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    dashboard?.invoiceAnalytics?.outstandingAmount ?? 0,
                  ),
                },
                {
                  label: "Refund",
                  value: formatCurrency(
                    dashboard?.orderAnalytics?.refundedAmount ?? 0,
                  ),
                },
                {
                  label: "Pending",
                  value: formatCurrency(
                    dashboard?.orderAnalytics?.pendingOrderAmount ?? 0,
                  ),
                },
              ]}
            />
            <StatisticsCard
              title="Total Value"
              value={formatCurrency(
                (dashboard as { totalInventoryValue?: number })
                  .totalInventoryValue ?? 0,
              )}
              description="Total inventory value"
              icon={DollarSign}
              variant="violet"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={[
                {
                  label: "Orders",
                  value: formatCurrency(
                    dashboard?.orderAnalytics?.totalRevenueExcludingCancelled ??
                      dashboard?.revenue?.fromOrders ??
                      0,
                  ),
                },
                {
                  label: "Invoices",
                  value: formatCurrency(dashboard?.revenue?.fromInvoices ?? 0),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    dashboard?.invoiceAnalytics?.outstandingAmount ?? 0,
                  ),
                },
                {
                  label: "Cancelled",
                  value: formatCurrency(
                    dashboard?.orderAnalytics?.cancelledOrderAmount ?? 0,
                  ),
                },
              ]}
            />
            <StatisticsCard
              title="Invoices"
              value={dashboard?.counts?.invoices ?? 0}
              description="Total invoices (store-wide)"
              icon={FileText}
              variant="sky"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={buildStoreInvoiceStatusBadges({
                paidCount:
                  dashboard?.invoiceAnalytics?.statusDistribution?.paid,
                partialCount: dashboard?.invoiceAnalytics?.partialCount,
                pendingCount:
                  dashboard?.invoiceAnalytics?.pendingCount ??
                  (dashboard?.invoiceAnalytics?.statusDistribution?.draft ??
                    0) +
                    (dashboard?.invoiceAnalytics?.statusDistribution?.sent ?? 0),
                overdueCount:
                  dashboard?.invoiceAnalytics?.statusDistribution?.overdue,
                cancelledCount:
                  dashboard?.invoiceAnalytics?.statusDistribution?.cancelled,
                refundedCount: dashboard?.orderAnalytics?.refundedCount,
              })}
            />
          </div>
        )}

        {/* Filters and Actions - Always visible, only disabled during auth check */}
        <div className="pb-6 flex justify-center">
          <div className={APP_SHELL_WIDTH_CLASS}>
            <OrderFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              pagination={pagination}
              setPagination={setPagination}
              allOrders={allOrders}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              selectedPaymentStatuses={selectedPaymentStatuses}
              setSelectedPaymentStatuses={setSelectedPaymentStatuses}
              showOrderSourceFilter={isAdminCombined}
              orderSourceFilter={orderSourceFilter}
              setOrderSourceFilter={
                isAdminCombined ? setOrderSourceFilter : undefined
              }
            />
          </div>
        </div>

        {/* Order Table - Shows skeleton during auth check or data loading */}
        <OrderTable
          data={allOrders || []}
          columns={columns}
          isLoading={tableDataLoading}
          searchTerm={searchTerm}
          pagination={pagination}
          setPagination={setPagination}
          selectedStatuses={selectedStatuses}
          selectedPaymentStatuses={selectedPaymentStatuses}
        />

        {/* Defer Dialog until mount to avoid Radix aria-controls hydration mismatch */}
        {isMounted && (
          <OrderDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditingOrder(null);
              }
            }}
            editingOrder={editingOrder}
            onEditOrder={(order) => {
              setEditingOrder(order);
            }}
          >
            <div style={{ display: "none" }} />
          </OrderDialog>
        )}

        {/* REQ-0061: InvoiceDialog create mode pre-selected from an order row */}
        {isMounted && invoiceDialogOpen && (
          <InvoiceDialog
            open={invoiceDialogOpen}
            onOpenChange={(open) => {
              setInvoiceDialogOpen(open);
              if (!open) setInvoiceOrderId("");
            }}
            editingInvoice={null}
            initialOrderId={invoiceOrderId}
          />
        )}
      </div>
    );
  },
);

OrderList.displayName = "OrderList";

export default OrderList;
