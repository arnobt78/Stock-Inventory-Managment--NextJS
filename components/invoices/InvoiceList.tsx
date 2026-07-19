/**
 * Invoice List Component
 * Main component for displaying and managing invoices
 */

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { createInvoiceColumns } from "./InvoiceTableColumns";
import { useAuth } from "@/contexts";
import {
  useInvoices,
  useClientInvoices,
  useDashboard,
  useClientPortalDashboard,
} from "@/hooks/queries";
import {
  isDataSlotLoading,
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { buildStoreOrderStatusBadges } from "@/lib/ui/store-order-status-badges";
import InvoiceFilters from "./InvoiceFilters";
import InvoiceDialog from "./InvoiceDialog";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import {
  DollarSign,
  CreditCard,
  ShoppingCart,
  FileText,
  Clock,
} from "lucide-react";
import { PageSectionHeader } from "@/components/shared";
import type { Invoice } from "@/types";
import type { InvoiceForPage } from "@/lib/server/invoices-data";
import type { InvoiceWithSource } from "./InvoiceTableColumns";
import type { InvoiceSourceFilterValue } from "./InvoiceSourceFilter";
import type { DashboardStats, ClientPortalDashboard } from "@/types";
import {
  buildInvoiceListFilters,
  isDefaultInvoiceListFilters,
} from "@/lib/invoices/invoice-list-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InvoiceTable = dynamic(
  () =>
    import("./InvoiceTable").then((mod) => ({
      default: mod.InvoiceTable,
    })),
  {
    ssr: true,
  },
);

export type InvoiceListProps = {
  /** When set (e.g. "/admin/invoices"), Invoice # links use {detailHrefBase}/{id} */
  detailHrefBase?: string;
  /** When "clientInvoices", fetches client invoices; when "adminCombined", merge personal + client with Invoice type filter */
  dataSource?: "invoices" | "clientInvoices" | "adminCombined";
  /** SSR-passed invoices for first-render hydration (REQ-0021) */
  initialInvoices?: Invoice[] | InvoiceForPage[];
  /** SSR client-leg invoices for adminCombined (REQ-0025) */
  initialClientInvoices?: Invoice[] | InvoiceForPage[];
  /** SSR dashboard stats for header cards (REQ-0025) */
  initialStats?: DashboardStats | null;
  /** SSR client portal for client /invoices cards */
  initialClientPortal?: ClientPortalDashboard;
};

const InvoiceList = React.memo(
  ({
    detailHrefBase,
    dataSource = "invoices",
    initialInvoices,
    initialClientInvoices,
    initialStats,
    initialClientPortal,
  }: InvoiceListProps = {}) => {
    // Track if component has mounted on client to prevent hydration mismatch
    const isMountedRef = useRef(false);
    const [isMounted, setIsMounted] = useState(false);

    const pathname = usePathname();
    const { user } = useAuth();
    const role = user?.role;

    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationType>({
      pageIndex: 0,
      pageSize: 8,
    });
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [invoiceSourceFilter, setInvoiceSourceFilter] =
      useState<InvoiceSourceFilterValue>("both");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

    const enableClientInvoices =
      dataSource === "clientInvoices" || dataSource === "adminCombined";
    const enableDashboard =
      (pathname === "/invoices" && role !== "client" && role !== "supplier") ||
      dataSource === "adminCombined";
    const enableClientPortal = pathname === "/invoices" && role === "client";

    const useStoreInvoiceScope =
      dataSource === "invoices" &&
      pathname === "/invoices" &&
      role !== "client" &&
      role !== "supplier";

    const apiFilters = useMemo(
      () =>
        buildInvoiceListFilters({
          searchTerm: debouncedSearchTerm,
          scope: useStoreInvoiceScope ? "store" : undefined,
        }),
      [debouncedSearchTerm, useStoreInvoiceScope],
    );

    const clientApiFilters = useMemo(
      () =>
        buildInvoiceListFilters({
          searchTerm: debouncedSearchTerm,
        }),
      [debouncedSearchTerm],
    );

    const useDefaultInvoiceFilters = isDefaultInvoiceListFilters(apiFilters);
    const useDefaultClientFilters =
      isDefaultInvoiceListFilters(clientApiFilters);

    const invoicesQueryDefault = useInvoices(
      apiFilters,
      useDefaultInvoiceFilters &&
        (dataSource === "invoices" || dataSource === "adminCombined")
        ? initialInvoices
        : undefined,
    );
    const invoicesQueryClient = useClientInvoices(
      clientApiFilters,
      useDefaultClientFilters &&
        (dataSource === "clientInvoices" || dataSource === "adminCombined")
        ? (initialClientInvoices as Invoice[] | undefined)
        : undefined,
      { enabled: enableClientInvoices },
    );
    const dashboardQuery = useDashboard(initialStats ?? undefined, {
      enabled: enableDashboard,
    });
    const dashboard =
      dataSource === "adminCombined" ? (dashboardQuery.data ?? null) : null;
    /** Show store-wide state cards only for admin/user on /invoices (not for client/supplier) */
    const isUserInvoicesPage =
      pathname === "/invoices" &&
      user?.role !== "client" &&
      user?.role !== "supplier";
    /** Client on /invoices: show client-specific invoice state cards (same data as /client portal) */
    const isClientInvoicesPage =
      pathname === "/invoices" && user?.role === "client";
    const portalDashboardQuery = useClientPortalDashboard(
      enableClientPortal ? initialClientPortal : undefined,
    );
    const clientPortalDashboard = isClientInvoicesPage
      ? (portalDashboardQuery.data ?? null)
      : null;
    const invoicesPageStats = isUserInvoicesPage
      ? (dashboardQuery.data ?? null)
      : null;
    const invoicesQuery =
      dataSource === "clientInvoices"
        ? invoicesQueryClient
        : invoicesQueryDefault;

    useSyncSsrQueryData(
      queryKeys.invoices.list(apiFilters as Record<string, unknown>),
      useDefaultInvoiceFilters &&
        (dataSource === "invoices" || dataSource === "adminCombined")
        ? initialInvoices
        : undefined,
    );
    useSyncSsrQueryData(
      queryKeys.clientInvoices.list(
        clientApiFilters as Record<string, unknown>,
      ),
      useDefaultClientFilters && enableClientInvoices
        ? initialClientInvoices
        : undefined,
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

    const mergedInvoicesForAdmin = useMemo((): InvoiceWithSource[] => {
      if (dataSource !== "adminCombined" || !user) return [];
      const personal = invoicesQueryDefault.data ?? [];
      const client = invoicesQueryClient.data ?? [];
      const byId = new Map<string, InvoiceWithSource>();
      personal.forEach((inv) => {
        const isPersonal = inv.orderUserId === user.id;
        byId.set(inv.id, {
          ...inv,
          _source: isPersonal ? "personal" : "client",
          _displayName: isPersonal
            ? (user.name ?? "You")
            : (inv.clientName ?? inv.customerDisplay ?? "Client"),
        });
      });
      client.forEach((inv) => {
        if (!byId.has(inv.id)) {
          byId.set(inv.id, {
            ...inv,
            _source: "client",
            _displayName: inv.customerDisplay ?? inv.clientName ?? "Client",
          });
        } else {
          const existing = byId.get(inv.id)!;
          const isPersonal = existing.orderUserId === user.id;
          if (!isPersonal) {
            byId.set(inv.id, {
              ...existing,
              _source: "client",
              _displayName:
                inv.customerDisplay ??
                existing.clientName ??
                existing._displayName ??
                "Client",
            });
          }
        }
      });
      return Array.from(byId.values());
    }, [dataSource, user, invoicesQueryDefault.data, invoicesQueryClient.data]);

    const effectiveDetailBase =
      dataSource === "clientInvoices"
        ? "/admin/client-invoices"
        : dataSource === "adminCombined"
          ? "/admin/invoices"
          : detailHrefBase;

    const allInvoicesRaw =
      dataSource === "adminCombined"
        ? mergedInvoicesForAdmin
        : (invoicesQuery.data ?? []);
    const allInvoices = useMemo(() => {
      if (dataSource !== "adminCombined") return allInvoicesRaw;
      if (invoiceSourceFilter === "both") return allInvoicesRaw;
      return (allInvoicesRaw as InvoiceWithSource[]).filter(
        (inv) => inv._source === invoiceSourceFilter,
      );
    }, [dataSource, invoiceSourceFilter, allInvoicesRaw]);

    // Mark component as mounted after client-side hydration
    useEffect(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        queueMicrotask(() => setIsMounted(true));
      }
    }, []);

    const handleEditInvoice = useCallback((invoice: Invoice) => {
      setEditingInvoice(invoice);
      setEditDialogOpen(true);
      // TODO: Implement InvoiceDialog component for editing invoices
    }, []);

    const columns = useMemo(
      () =>
        createInvoiceColumns(handleEditInvoice, effectiveDetailBase, {
          showSourceBadge: dataSource === "adminCombined",
          showIssuedBy: isClientInvoicesPage,
        }),
      [
        handleEditInvoice,
        effectiveDetailBase,
        dataSource,
        isClientInvoicesPage,
      ],
    );

    const isSearchDebouncing = searchTerm !== debouncedSearchTerm;

    // REQ-0021: shell-first — only data slots pulse
    const tableDataLoading =
      dataSource === "adminCombined"
        ? isDataSlotLoading(invoicesQueryDefault, initialInvoices) ||
          (enableClientInvoices
            ? isDataSlotLoading(invoicesQueryClient, initialClientInvoices)
            : false) ||
          isSearchDebouncing
        : dataSource === "clientInvoices"
          ? isDataSlotLoading(invoicesQueryClient, initialClientInvoices) ||
            isSearchDebouncing
          : isDataSlotLoading(invoicesQuery, initialInvoices) ||
            isSearchDebouncing;
    const dashboardCardsLoading = enableDashboard
      ? isDataSlotUnsettled(dashboardQuery, initialStats ?? undefined)
      : false;
    const clientPortalCardsLoading = enableClientPortal
      ? isDataSlotUnsettled(portalDashboardQuery, initialClientPortal)
      : false;

    const isClientInvoices = dataSource === "clientInvoices";
    const isAdminCombined = dataSource === "adminCombined";

    // Always render the UI structure to prevent flashing
    // Only the table will show skeleton during initial load
    return (
      <div className="flex flex-col poppins">
        {/* Invoice Management Section Header */}
        <PageSectionHeader
          as="h2"
          icon={FileText}
          tone="emerald"
          title={
            isAdminCombined
              ? "Store Invoices Management (self + client)"
              : isClientInvoices
                ? "Client Invoices"
                : isClientInvoicesPage
                  ? "My Invoices"
                  : "Invoice Management"
          }
          description={
            isAdminCombined
              ? "Invoices for your orders and for client orders. Filter by invoice type, status, and search."
              : isClientInvoices
                ? "Invoices for orders placed by clients that include your products. View details, send, and track payment."
                : isClientInvoicesPage
                  ? "Your invoices, payment status, and order history. View details and track what you owe or have paid."
                  : "Manage invoices, track payment status, monitor due dates, and handle billing. View invoice history, update statuses, and send invoices to clients."
          }
        />

        {/* Store-wide state cards — only on /invoices page (user), same as homepage */}
        {isUserInvoicesPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
            <StatisticsCard
              title="Total Value"
              value={formatCurrency(
                invoicesPageStats?.totalInventoryValue ?? 0,
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
                    invoicesPageStats?.orderAnalytics
                      ?.totalRevenueExcludingCancelled ??
                      invoicesPageStats?.revenue?.fromOrders ??
                      0,
                  ),
                },
                {
                  label: "Invoices",
                  value: formatCurrency(
                    invoicesPageStats?.revenue?.fromInvoices ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    invoicesPageStats?.invoiceAnalytics?.outstandingAmount ?? 0,
                  ),
                },
                {
                  label: "Cancelled",
                  value: formatCurrency(
                    invoicesPageStats?.orderAnalytics?.cancelledOrderAmount ??
                      0,
                  ),
                },
              ]}
            />
            <StatisticsCard
              title="Total Revenue"
              value={formatCurrency(
                invoicesPageStats?.orderAnalytics
                  ?.totalRevenueExcludingCancelled ??
                  invoicesPageStats?.revenue?.fromOrders ??
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
                    invoicesPageStats?.orderAnalytics?.paidOrderAmount ?? 0,
                  ),
                },
                {
                  label: "Partial",
                  value: formatCurrency(
                    invoicesPageStats?.orderAnalytics?.partialOrderAmount ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    invoicesPageStats?.invoiceAnalytics?.outstandingAmount ?? 0,
                  ),
                },
                {
                  label: "Refund",
                  value: formatCurrency(
                    invoicesPageStats?.orderAnalytics?.refundedAmount ?? 0,
                  ),
                },
                {
                  label: "Pending",
                  value: formatCurrency(
                    invoicesPageStats?.orderAnalytics?.pendingOrderAmount ?? 0,
                  ),
                },
                ...(invoicesPageStats?.selfOthersBreakdown
                  ? [
                      {
                        label: "Self",
                        value: formatCurrency(
                          invoicesPageStats?.selfOthersBreakdown.revenueSelf,
                        ),
                      },
                      {
                        label: "Others",
                        value: formatCurrency(
                          invoicesPageStats?.selfOthersBreakdown.revenueOthers,
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            <StatisticsCard
              title="Total Orders"
              value={invoicesPageStats?.counts.orders}
              description="Total orders placed (self + client)"
              icon={ShoppingCart}
              variant="blue"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={buildStoreOrderStatusBadges({
                statusDistribution:
                  invoicesPageStats?.orderAnalytics?.statusDistribution,
                refundedCount: invoicesPageStats?.orderAnalytics?.refundedCount,
                selfOthers: invoicesPageStats?.selfOthersBreakdown
                  ? {
                      orderSelfCount:
                        invoicesPageStats.selfOthersBreakdown.orderSelfCount,
                      orderOthersCount:
                        invoicesPageStats.selfOthersBreakdown.orderOthersCount,
                    }
                  : null,
              })}
            />
            <StatisticsCard
              title="Invoices"
              value={invoicesPageStats?.counts.invoices}
              description="Total invoices (store-wide)"
              icon={FileText}
              variant="sky"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value:
                    invoicesPageStats?.invoiceAnalytics?.statusDistribution
                      ?.paid ?? 0,
                },
                {
                  label: "Partial",
                  value: invoicesPageStats?.invoiceAnalytics?.partialCount ?? 0,
                },
                {
                  label: "Pending",
                  value:
                    invoicesPageStats?.invoiceAnalytics?.pendingCount ??
                    (invoicesPageStats?.invoiceAnalytics?.statusDistribution
                      ?.draft ?? 0) +
                      (invoicesPageStats?.invoiceAnalytics?.statusDistribution
                        ?.sent ?? 0),
                },
                {
                  label: "Overdue",
                  value:
                    invoicesPageStats?.invoiceAnalytics?.statusDistribution
                      ?.overdue ?? 0,
                },
                {
                  label: "Cancelled",
                  value:
                    invoicesPageStats?.invoiceAnalytics?.statusDistribution
                      ?.cancelled ?? 0,
                },
                {
                  label: "Refunded",
                  value: invoicesPageStats?.orderAnalytics?.refundedCount ?? 0,
                },
                ...(invoicesPageStats?.selfOthersBreakdown
                  ? [
                      {
                        label: "Self",
                        value:
                          invoicesPageStats?.selfOthersBreakdown
                            .invoiceSelfCount,
                      },
                      {
                        label: "Others",
                        value:
                          invoicesPageStats?.selfOthersBreakdown
                            .invoiceOthersCount,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        )}

        {/* Client invoice state cards — /invoices as client (same data as /client portal) */}
        {isClientInvoicesPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
            <StatisticsCard
              title="Total Orders"
              value={clientPortalDashboard?.totalOrders}
              description="Your order history"
              icon={ShoppingCart}
              variant="violet"
              valueLoading={clientPortalCardsLoading}
              badgeValuesLoading={clientPortalCardsLoading}
              badges={[
                {
                  label: "Orders",
                  value: formatCurrency(clientPortalDashboard?.totalSpent ?? 0),
                },
                {
                  label: "Invoices",
                  value: formatCurrency(
                    clientPortalDashboard?.totalInvoiceAmount ?? 0,
                  ),
                },
                {
                  label: "Due",
                  value: formatCurrency(
                    clientPortalDashboard?.outstandingAmount ?? 0,
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
              title="Awaiting Payment"
              value={clientPortalDashboard?.ordersAwaitingPayment ?? 0}
              description="Orders awaiting payment"
              icon={Clock}
              variant="amber"
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
              title="Invoices"
              value={clientPortalDashboard?.invoiceBreakdown?.total ?? 0}
              description="Total invoices"
              icon={FileText}
              variant="sky"
              valueLoading={clientPortalCardsLoading}
              badgeValuesLoading={clientPortalCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value: clientPortalDashboard?.invoiceBreakdown?.paid ?? 0,
                },
                {
                  label: "Partial",
                  value: clientPortalDashboard?.invoiceBreakdown?.partial ?? 0,
                },
                {
                  label: "Pending",
                  value: clientPortalDashboard?.invoiceBreakdown?.pending ?? 0,
                },
                {
                  label: "Overdue",
                  value: clientPortalDashboard?.invoiceBreakdown?.overdue ?? 0,
                },
                {
                  label: "Cancelled",
                  value:
                    clientPortalDashboard?.invoiceBreakdown?.cancelled ?? 0,
                },
                {
                  label: "Refunded",
                  value: clientPortalDashboard?.invoiceBreakdown?.refunded ?? 0,
                },
              ]}
            />
          </div>
        )}

        {/* Summary cards — admin combined only (4 cards, 2 per row); same as dashboard/orders/products */}
        {isAdminCombined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 pb-6 items-stretch">
            <StatisticsCard
              title="Invoices"
              value={dashboard?.counts?.invoices ?? 0}
              description="Total invoices (store-wide)"
              icon={FileText}
              variant="sky"
              valueLoading={dashboardCardsLoading}
              badgeValuesLoading={dashboardCardsLoading}
              badges={[
                {
                  label: "Paid",
                  value:
                    dashboard?.invoiceAnalytics?.statusDistribution?.paid ?? 0,
                },
                {
                  label: "Partial",
                  value: dashboard?.invoiceAnalytics?.partialCount ?? 0,
                },
                {
                  label: "Pending",
                  value:
                    dashboard?.invoiceAnalytics?.pendingCount ??
                    (dashboard?.invoiceAnalytics?.statusDistribution?.draft ??
                      0) +
                      (dashboard?.invoiceAnalytics?.statusDistribution?.sent ??
                        0),
                },
                {
                  label: "Overdue",
                  value:
                    dashboard?.invoiceAnalytics?.statusDistribution?.overdue ??
                    0,
                },
                {
                  label: "Cancelled",
                  value:
                    dashboard?.invoiceAnalytics?.statusDistribution
                      ?.cancelled ?? 0,
                },
              ]}
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
          </div>
        )}

        {/* Filters and Actions - Always visible, only disabled during auth check */}
        <div className="pb-6 flex justify-center">
          <div className={APP_SHELL_WIDTH_CLASS}>
            <InvoiceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              pagination={pagination}
              setPagination={setPagination}
              allInvoices={allInvoices}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              showInvoiceSourceFilter={isAdminCombined}
              invoiceSourceFilter={invoiceSourceFilter}
              setInvoiceSourceFilter={
                isAdminCombined ? setInvoiceSourceFilter : undefined
              }
            />
          </div>
        </div>

        {/* Invoice Table - Shows skeleton during auth check or data loading */}
        <InvoiceTable
          data={allInvoices || []}
          columns={columns}
          isLoading={tableDataLoading}
          pagination={pagination}
          setPagination={setPagination}
          selectedStatuses={selectedStatuses}
        />

        {/* Defer Dialog until mount to avoid Radix aria-controls hydration mismatch */}
        {isMounted && (
          <InvoiceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            editingInvoice={editingInvoice}
            onEditInvoice={setEditingInvoice}
          />
        )}
      </div>
    );
  },
);

InvoiceList.displayName = "InvoiceList";

export default InvoiceList;
