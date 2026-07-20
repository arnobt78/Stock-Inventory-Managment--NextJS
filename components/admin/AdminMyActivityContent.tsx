"use client";

import React, { useMemo, useState } from "react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Truck,
  Warehouse as WarehouseIcon,
  TrendingUp,
  Search,
  FileText,
  FolderTree,
  UserRound,
} from "lucide-react";
import {
  useOrders,
  useProducts,
  useSuppliers,
  useWarehouses,
  useInvoices,
  useCategories,
  useUsers,
} from "@/hooks/queries";
import { cn } from "@/lib/utils";
import {
  isAnyDataSlotUnsettled,
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryDataMany,
} from "@/lib/react-query";
import { useAuth } from "@/contexts";
import {
  PageContentWrapper,
  PageSectionHeader,
  SectionTitleRow,
  ClientCurrency,
} from "@/components/shared";
import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import {
  DETAIL_PAGE_HEADER_SPACING_CLASS,
  PAGE_STATS_GRID_IN_SHELL_CLASS,
} from "@/lib/ui/shell-layout-styles";
import { formatStableCurrency } from "@/lib/format";
import { buildPaymentMoneyStats } from "@/lib/insights/payment-money-stats";
import { buildStoreOrderStatusBadges } from "@/lib/ui/store-order-status-badges";
import { buildStoreInvoiceStatusBadges } from "@/lib/ui/store-invoice-status-badges";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import {
  AdminEmbedDataTable,
  type AdminEmbedColumn,
} from "@/components/admin/AdminEmbedDataTable";
import { createOrderColumns } from "@/components/orders/OrderTableColumns";
import type { Order, UserForAdmin } from "@/types";
import type {
  ProductForHome,
  CategoryForHome,
  SupplierForHome,
} from "@/lib/server/home-data";
import type { OrderForPage } from "@/lib/server/orders-data";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

/** REQ-0168 — adapt Order-list ColumnDefs for AdminEmbedDataTable (no sort chrome). */
function orderColumnDefsToEmbed(
  defs: ColumnDef<Order>[],
): AdminEmbedColumn<OrderForPage>[] {
  const headers: Record<string, string> = {
    orderNumber: "Order #",
    total: "Total",
    status: "Status",
    paymentStatus: "Payment",
    invoice: "Invoice #",
    actions: "Actions",
  };
  return defs.map((def, index) => {
    const accessorKey = (def as { accessorKey?: string }).accessorKey;
    const id =
      typeof def.id === "string"
        ? def.id
        : typeof accessorKey === "string"
          ? accessorKey
          : `col-${index}`;
    return {
      id,
      header: headers[id] ?? id,
      headerClassName: id === "actions" ? "text-right" : undefined,
      cellClassName: id === "actions" ? "text-right" : undefined,
      render: (order) => {
        if (typeof def.cell !== "function") return null;
        // OrderForPage ISO strings vs Order Date — same cells as OrderList
        return def.cell({
          row: { original: order as unknown as Order },
        } as CellContext<Order, unknown>);
      },
    };
  });
}

export type AdminMyActivityContentProps = {
  initialOrders?: OrderForPage[];
  initialProducts?: ProductForHome[];
  initialSuppliers?: SupplierForHome[];
  initialWarehouses?: WarehouseForPage[];
  initialInvoices?: InvoiceForPage[];
  initialCategories?: CategoryForHome[];
  initialUsers?: UserForAdmin[];
};

/** REQ-0025 — SSR initialData via props (blocking prefetch in page.tsx). */
export default function AdminMyActivityContent({
  initialOrders,
  initialProducts,
  initialSuppliers,
  initialWarehouses,
  initialInvoices,
  initialCategories,
  initialUsers,
}: AdminMyActivityContentProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const { user: authUser } = useAuth();

  const ordersQuery = useOrders(initialOrders);
  const productsQuery = useProducts(initialProducts);
  const suppliersQuery = useSuppliers(initialSuppliers);
  const warehousesQuery = useWarehouses(initialWarehouses);
  const invoicesQuery = useInvoices(undefined, initialInvoices);
  const categoriesQuery = useCategories(initialCategories);
  const usersQuery = useUsers(initialUsers);

  useSyncSsrQueryDataMany([
    { queryKey: queryKeys.orders.lists(), serverData: initialOrders },
    { queryKey: queryKeys.products.lists(), serverData: initialProducts },
    { queryKey: queryKeys.suppliers.lists(), serverData: initialSuppliers },
    { queryKey: queryKeys.warehouses.lists(), serverData: initialWarehouses },
    {
      queryKey: queryKeys.invoices.list(undefined),
      serverData: initialInvoices,
    },
    { queryKey: queryKeys.categories.lists(), serverData: initialCategories },
    { queryKey: queryKeys.userManagement.lists(), serverData: initialUsers },
  ]);

  const orders = (ordersQuery.data ?? initialOrders ?? []) as OrderForPage[];
  const products = productsQuery.data ?? initialProducts ?? [];
  const suppliers = suppliersQuery.data ?? initialSuppliers ?? [];
  const warehouses = warehousesQuery.data ?? initialWarehouses ?? [];
  const invoices = invoicesQuery.data ?? initialInvoices ?? [];
  const categories = categoriesQuery.data ?? initialCategories ?? [];
  const users = usersQuery.data ?? initialUsers ?? [];

  // REQ-0021: shell-first — headers/cards stay visible; values pulse
  const cardsDataLoading = isAnyDataSlotUnsettled([
    { query: ordersQuery, serverInitial: initialOrders },
    { query: productsQuery, serverInitial: initialProducts },
    { query: suppliersQuery, serverInitial: initialSuppliers },
    { query: warehousesQuery, serverInitial: initialWarehouses },
    { query: invoicesQuery, serverInitial: initialInvoices },
    { query: categoriesQuery, serverInitial: initialCategories },
    { query: usersQuery, serverInitial: initialUsers },
  ]);
  const ordersTableLoading = isDataSlotLoading(ordersQuery, initialOrders);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // REQ-0156 — store-parity status dist for Total Orders badges
    const statusDistribution = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      const s = (o.status || "").toLowerCase();
      if (s in statusDistribution) {
        statusDistribution[s as keyof typeof statusDistribution] += 1;
      }
    }
    const refundedOrderCount = orders.filter(
      (o) => (o.paymentStatus || "").toLowerCase() === "refunded",
    ).length;
    const ordersByStatus: Record<string, number> = { ...statusDistribution };

    const productAvailable = products.filter(
      (p) =>
        (p.status || "").toLowerCase().replace(/\s+/g, "_") === "available",
    ).length;
    const productStockLow = products.filter(
      (p) =>
        (p.status || "").toLowerCase().replace(/\s+/g, "_") === "stock_low",
    ).length;
    const productStockOut = products.filter(
      (p) =>
        (p.status || "").toLowerCase().replace(/\s+/g, "_") === "stock_out",
    ).length;

    const categoryActive = categories.filter((c) => c.status === true).length;
    const categoryInactive = categories.filter(
      (c) => c.status === false,
    ).length;

    const supplierActive = suppliers.filter((s) => s.status === true).length;
    const supplierInactive = suppliers.filter((s) => s.status === false).length;

    const warehouseActive = warehouses.filter((w) => w.status === true).length;
    const warehouseInactive = warehouses.filter(
      (w) => w.status === false,
    ).length;

    // REQ-0154 — invoice-money partition (not order.total for partial)
    const moneyStats = buildPaymentMoneyStats(invoices);
    const invoicePaid = moneyStats.paidInvoiceCount;
    const invoicePartial = moneyStats.partialInvoiceCount;
    const invoicePending = moneyStats.pendingInvoiceCount;
    const invoiceOverdue = invoices.filter(
      (i) => i.status === "overdue",
    ).length;
    const invoiceCancelled = invoices.filter(
      (i) => i.status === "cancelled",
    ).length;
    // Store parity: Refunded badge uses order paymentStatus refunded count
    const invoiceRefunded = refundedOrderCount;
    const paidRevenue = moneyStats.paidCollected;
    const outstandingAmount = moneyStats.dueOutstanding;

    const userAdmin = users.filter((u) => u.role === "admin").length;
    const userClient = users.filter((u) => u.role === "client").length;
    const userSupplier = users.filter((u) => u.role === "supplier").length;

    const orderPaid = orders.filter(
      (o) => (o.paymentStatus || "").toLowerCase() === "paid",
    ).length;
    const orderUnpaid = orders.filter(
      (o) =>
        (o.paymentStatus || "").toLowerCase() === "unpaid" ||
        (o.paymentStatus || "").toLowerCase() === "partial",
    ).length;

    const paidAmount = moneyStats.paidCollected;
    const partialAmount = moneyStats.partialCollected;
    const refundedAmount = orders
      .filter((o) => (o.paymentStatus || "").toLowerCase() === "refunded")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const unpaidAmount = moneyStats.pendingUnpaidDue;
    const cancelledAmount = orders
      .filter(
        (o) =>
          (o.status || "").toLowerCase() === "cancelled" &&
          (o.paymentStatus || "").toLowerCase() !== "refunded",
      )
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      totalOrders,
      totalRevenue,
      paidAmount,
      partialAmount,
      refundedAmount,
      unpaidAmount,
      cancelledAmount,
      totalProducts: products.length,
      totalUsers: users.length,
      totalSuppliers: suppliers.length,
      totalWarehouses: warehouses.length,
      totalInvoices: invoices.length,
      totalCategories: categories.length,
      avgOrderValue,
      ordersByStatus,
      statusDistribution,
      refundedOrderCount,
      productAvailable,
      productStockLow,
      productStockOut,
      categoryActive,
      categoryInactive,
      supplierActive,
      supplierInactive,
      warehouseActive,
      warehouseInactive,
      invoicePaid,
      invoicePartial,
      invoicePending,
      invoiceOverdue,
      invoiceCancelled,
      invoiceRefunded,
      paidRevenue,
      outstandingAmount,
      userAdmin,
      userClient,
      userSupplier,
      orderPaid,
      orderUnpaid,
    };
  }, [orders, products, suppliers, warehouses, invoices, categories, users]);

  const recentOrders = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const q = searchTerm.trim().toLowerCase();
    const filtered = q
      ? sorted.filter((o) => {
          const productHit = (o.items ?? []).some((item) =>
            (item.productName ?? "").toLowerCase().includes(q),
          );
          const invoiceHit = (o.invoiceForOrder?.invoiceNumber ?? "")
            .toLowerCase()
            .includes(q);
          return (
            o.orderNumber.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q) ||
            productHit ||
            invoiceHit ||
            (authUser?.name ?? "").toLowerCase().includes(q) ||
            (authUser?.email ?? "").toLowerCase().includes(q)
          );
        })
      : sorted;
    return filtered.slice(0, 5);
  }, [orders, searchTerm, authUser?.name, authUser?.email]);

  /** REQ-0168 — Order-list columns via AdminEmbedDataTable (no OrderList chrome / FAB) */
  const recentOrderColumns = useMemo(
    () =>
      orderColumnDefsToEmbed(
        // REQ-0169 — no onEdit (no OrderDialog host); View/Cancel/invoice still work
        createOrderColumns(undefined, "/admin/orders"),
      ),
    [],
  );

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h1"
          icon={UserRound}
          tone="sky"
          title="My Activity (self-only as user)"
          description="Your orders, products, and key metrics as the store owner as you placed order, created products, invoices, and more. This is self-only data. This is different from the Store Analytics & Dashboard, which is the overall store metrics as the store owner & other users."
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
        />

        {/* REQ-0169 — shell token under gap-6 (no stacked pb-6) */}
        <div
          className={cn(
            PAGE_STATS_GRID_IN_SHELL_CLASS,
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          )}
        >
          <StatisticsCard
            title="Total Orders"
            value={stats.totalOrders}
            description="All time orders (self)"
            icon={ShoppingCart}
            variant="rose"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={buildStoreOrderStatusBadges({
              statusDistribution: stats.statusDistribution,
              refundedCount: stats.refundedOrderCount,
            })}
          />
          <StatisticsCard
            title="Total order value"
            value={<ClientCurrency value={stats.totalRevenue} />}
            description="Your orders history (self)"
            icon={DollarSign}
            variant="emerald"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Paid",
                value: formatStableCurrency(stats.paidAmount),
              },
              {
                label: "Partial",
                value: formatStableCurrency(stats.partialAmount),
              },
              {
                label: "Due",
                value: formatStableCurrency(stats.outstandingAmount),
              },
              {
                label: "Refunded",
                value: formatStableCurrency(stats.refundedAmount),
              },
              {
                label: "Cancelled",
                value: formatStableCurrency(stats.cancelledAmount),
              },
              {
                label: "Pending",
                value: formatStableCurrency(stats.unpaidAmount),
              },
            ]}
          />
          <StatisticsCard
            title="Total Products"
            value={stats.totalProducts}
            description="Total products in inventory"
            icon={Package}
            variant="violet"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              { label: "Available", value: stats.productAvailable },
              { label: "Stock Low", value: stats.productStockLow },
              { label: "Stock Out", value: stats.productStockOut },
            ]}
          />
          <StatisticsCard
            title="Total Users"
            value={stats.totalUsers}
            description="Registered users"
            icon={Users}
            variant="amber"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              { label: "Admin", value: stats.userAdmin },
              { label: "Client", value: stats.userClient },
              { label: "Supplier", value: stats.userSupplier },
            ]}
          />
          <StatisticsCard
            title="Total Suppliers"
            value={stats.totalSuppliers}
            description="Suppliers"
            icon={Truck}
            variant="sky"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              { label: "Active", value: stats.supplierActive },
              { label: "Inactive", value: stats.supplierInactive },
            ]}
          />
          <StatisticsCard
            title="Total Warehouses"
            value={stats.totalWarehouses}
            description="Storage locations"
            icon={WarehouseIcon}
            variant="blue"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              { label: "Active", value: stats.warehouseActive },
              { label: "Inactive", value: stats.warehouseInactive },
            ]}
          />
          <StatisticsCard
            title="Invoices"
            value={stats.totalInvoices}
            description="Total invoices generated"
            icon={FileText}
            variant="blue"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={buildStoreInvoiceStatusBadges({
              paidCount: stats.invoicePaid,
              partialCount: stats.invoicePartial,
              pendingCount: stats.invoicePending,
              overdueCount: stats.invoiceOverdue,
              cancelledCount: stats.invoiceCancelled,
              refundedCount: stats.invoiceRefunded,
            })}
          />
          <StatisticsCard
            title="Categories"
            value={stats.totalCategories}
            description="Product categories"
            icon={FolderTree}
            variant="sky"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              { label: "Active", value: stats.categoryActive },
              { label: "Inactive", value: stats.categoryInactive },
            ]}
          />
          <StatisticsCard
            title="Average Order Value"
            value={<ClientCurrency value={stats.avgOrderValue} />}
            description="Per order average (self)"
            icon={TrendingUp}
            variant="orange"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Paid Revenue",
                value: formatStableCurrency(stats.paidAmount),
              },
              {
                label: "Due",
                value: formatStableCurrency(stats.outstandingAmount),
              },
            ]}
          />
        </div>

        <article
          className={cn(
            "rounded-[28px] border border-teal-400/30 dark:border-teal-400/30",
            "bg-gradient-to-br from-teal-500/25 via-teal-500/10 to-teal-500/5 dark:from-teal-500/25 dark:via-teal-500/10 dark:to-teal-500/5",
            "shadow-[0_30px_80px_rgba(20,184,166,0.35)] dark:shadow-[0_30px_80px_rgba(20,184,166,0.25)]",
            "p-2 sm:p-4 backdrop-blur-md overflow-hidden",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
            <SectionTitleRow
              as="h3"
              title="Recent Orders"
              icon={ShoppingCart}
              iconClassName="text-teal-600 dark:text-teal-400"
              iconTile
              subtitle={
                <>
                  Latest 5 orders (self: {authUser?.name ?? "—"},{" "}
                  {authUser?.email ?? "—"})
                </>
              }
            />
            <div className="relative w-full sm:max-w-md shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by order #, product, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(FILTER_SEARCH_INPUT_SKY_CLASS, "pr-4")}
              />
            </div>
          </div>
          <AdminEmbedDataTable
            columns={recentOrderColumns}
            data={recentOrders}
            loading={ordersTableLoading}
            emptyMessage="No orders found"
            emptyIcon={ShoppingCart}
            getRowKey={(order) => order.id}
          />
        </article>
      </div>
    </PageContentWrapper>
  );
}
