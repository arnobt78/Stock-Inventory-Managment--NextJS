"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Eye,
  FileText,
  FolderTree,
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
import { isAnyDataSlotLoading, isDataSlotLoading } from "@/lib/react-query";
import { useAuth } from "@/contexts";
import { PageContentWrapper } from "@/components/shared";
import { ClientCurrency, ClientCompactDateTime } from "@/components/shared";
import { formatStableCurrency } from "@/lib/format";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import type { UserForAdmin } from "@/types";
import type {
  ProductForHome,
  CategoryForHome,
  SupplierForHome,
} from "@/lib/server/home-data";
import type { OrderForPage } from "@/lib/server/orders-data";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

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

  const orders = ordersQuery.data ?? initialOrders ?? [];
  const products = productsQuery.data ?? initialProducts ?? [];
  const suppliers = suppliersQuery.data ?? initialSuppliers ?? [];
  const warehouses = warehousesQuery.data ?? initialWarehouses ?? [];
  const invoices = invoicesQuery.data ?? initialInvoices ?? [];
  const categories = categoriesQuery.data ?? initialCategories ?? [];
  const users = usersQuery.data ?? initialUsers ?? [];

  // REQ-0021: shell-first — headers/cards stay visible; values pulse
  const cardsDataLoading = isAnyDataSlotLoading([
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
    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    });

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

    const invoicePaid = invoices.filter((i) => i.status === "paid").length;
    const invoicePending = invoices.filter(
      (i) => i.status === "draft" || i.status === "sent",
    ).length;
    const invoiceOverdue = invoices.filter(
      (i) => i.status === "overdue",
    ).length;
    const paidRevenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.total ?? 0), 0);
    const outstandingAmount = invoices
      .filter(
        (i) =>
          i.status === "sent" || i.status === "draft" || i.status === "overdue",
      )
      .reduce((sum, i) => sum + Number(i.amountDue ?? 0), 0);

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

    const paidAmount = orders
      .filter((o) => (o.paymentStatus || "").toLowerCase() === "paid")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const refundedAmount = orders
      .filter((o) => (o.paymentStatus || "").toLowerCase() === "refunded")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const unpaidAmount = orders
      .filter(
        (o) =>
          (o.status || "").toLowerCase() !== "cancelled" &&
          ((o.paymentStatus || "").toLowerCase() === "unpaid" ||
            (o.paymentStatus || "").toLowerCase() === "partial"),
      )
      .reduce((sum, o) => sum + Number(o.total), 0);
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
      invoicePending,
      invoiceOverdue,
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
    const filtered = searchTerm.trim()
      ? sorted.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (authUser?.name ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (authUser?.email ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        )
      : sorted;
    return filtered.slice(0, 5);
  }, [orders, searchTerm, authUser?.name, authUser?.email]);

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="flex flex-col items-start text-left ">
          <h1 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-white ">
            My Activity (self-only as user)
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Your orders, products, and key metrics as the store owner as you
            placed order, created products, invoices, and more. This is
            self-only data. This is different from the Store Analytics &
            Dashboard, which is the overall store metrics as the store owner &
            other users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch">
          <StatisticsCard
            title="Total Orders"
            value={stats.totalOrders}
            description="All time orders (self)"
            icon={ShoppingCart}
            variant="rose"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Pending",
                value: stats.ordersByStatus?.pending ?? 0,
              },
              {
                label: "Shipped",
                value:
                  (stats.ordersByStatus?.shipped ?? 0) +
                  (stats.ordersByStatus?.processing ?? 0),
              },
              {
                label: "Delivered",
                value: stats.ordersByStatus?.delivered ?? 0,
              },
              {
                label: "Cancelled",
                value: stats.ordersByStatus?.cancelled ?? 0,
              },
            ]}
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
                label: "Refunded",
                value: formatStableCurrency(stats.refundedAmount),
              },
              {
                label: "Cancelled",
                value: formatStableCurrency(stats.cancelledAmount),
              },
              {
                label: "Unpaid",
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
            badges={[
              { label: "Paid", value: stats.invoicePaid },
              { label: "Pending", value: stats.invoicePending },
              { label: "Overdue", value: stats.invoiceOverdue },
            ]}
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
                label: "Outstanding",
                value: formatStableCurrency(stats.unpaidAmount),
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-md sm:text-lg font-medium text-gray-700 dark:text-white">
                Recent Orders
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Latest 5 orders (self: {authUser?.name ?? "—"},{" "}
                {authUser?.email ?? "—"})
              </p>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "h-10 pl-9 pr-4 w-full rounded-[28px]",
                  "bg-white/10 dark:bg-white/5 backdrop-blur-md",
                  "border border-sky-400/30 dark:border-white/20",
                  "text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40",
                  "focus-visible:border-sky-400 focus-visible:ring-sky-500/50",
                  "shadow-[0_10px_30px_rgba(2,132,199,0.15)]",
                )}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-300/30 dark:border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Order ID
                </TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Status
                </TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Payment
                </TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Amount
                </TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Items
                </TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Date
                </TableHead>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            {ordersTableLoading ? (
              <TableBodyPulseRows columnCount={7} rows={5} striped={false} />
            ) : (
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow className="border-gray-300/30 dark:border-white/10">
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-600 dark:text-gray-400 py-8"
                    >
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-gray-300/30 dark:border-white/10"
                    >
                      <TableCell className="font-mono text-xs text-gray-700 dark:text-gray-100">
                        {order.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status ?? ""} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge
                          status={order.paymentStatus ?? ""}
                        />
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-200">
                        <ClientCurrency value={Number(order.total)} />
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-200">
                        {order.items?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        <ClientCompactDateTime date={order.createdAt} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </article>
      </div>
    </PageContentWrapper>
  );
}
