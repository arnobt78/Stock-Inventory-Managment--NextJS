"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
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
  Warehouse,
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
import { useAuth } from "@/contexts";
import { PageContentWrapper } from "@/components/shared";
import { ClientCurrency, ClientCompactDateTime } from "@/components/shared";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { StatisticsCardSkeleton } from "@/components/home/StatisticsCardSkeleton";
import { Badge } from "@/components/ui/badge";
import { formatStableCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

function getStatusBadgeClass(status: string): string {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "processing":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

function getPaymentBadgeClass(status: string): string {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "paid":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "unpaid":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "partial":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "refunded":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

export default function AdminMyActivityContent() {
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user: authUser } = useAuth();

  const ordersQuery = useOrders();
  const productsQuery = useProducts();
  const suppliersQuery = useSuppliers();
  const warehousesQuery = useWarehouses();
  const invoicesQuery = useInvoices();
  const categoriesQuery = useCategories();
  const usersQuery = useUsers();

  const orders = ordersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const anyPending =
    ordersQuery.isPending ||
    productsQuery.isPending ||
    suppliersQuery.isPending ||
    warehousesQuery.isPending ||
    invoicesQuery.isPending ||
    categoriesQuery.isPending ||
    usersQuery.isPending;
  const showSkeleton = !isMounted || anyPending;

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

  const tableSkeletonHeight = 280;

  return (
    <PageContentWrapper>
      <div className="space-y-6">
        <div className="flex flex-col items-start text-left pb-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white pb-1">
            My Activity (self-only as user)
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Your orders, products, and key metrics as the store owner as you
            placed order, created products, invoices, and more. This is
            self-only data. This is different from the Store Analytics &
            Dashboard, which is the overall store metrics as the store owner &
            other users.
          </p>
        </div>

        {showSkeleton ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <StatisticsCardSkeleton key={i} />
              ))}
            </div>
            <article
              className={cn(
                "rounded-[28px] border border-gray-300/30 dark:border-white/10",
                "bg-gradient-to-br from-gray-100/50 via-gray-100/30 to-gray-100/20 dark:from-white/5 dark:via-white/5 dark:to-white/5",
                "p-4 sm:p-6 backdrop-blur-sm overflow-hidden",
              )}
              style={{ minHeight: tableSkeletonHeight }}
            >
              <div className="h-5 w-32 bg-gray-300/50 dark:bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-gray-300/50 dark:bg-white/10 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-gray-300/50 dark:bg-white/10 rounded animate-pulse" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 w-full bg-gray-300/50 dark:bg-white/10 rounded animate-pulse"
                  />
                ))}
              </div>
            </article>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              <StatisticsCard
                title="Total Orders"
                value={stats.totalOrders}
                description="All time orders (self)"
                icon={ShoppingCart}
                variant="rose"
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
                badges={[
                  { label: "Paid", value: formatStableCurrency(stats.paidAmount) },
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
                badges={[
                  { label: "Active", value: stats.supplierActive },
                  { label: "Inactive", value: stats.supplierInactive },
                ]}
              />
              <StatisticsCard
                title="Total Warehouses"
                value={stats.totalWarehouses}
                description="Storage locations"
                icon={Warehouse}
                variant="blue"
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
                "p-4 sm:p-6 backdrop-blur-sm overflow-hidden",
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-md sm:text-lg font-semibold text-gray-900 dark:text-white">
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
                      "bg-white/10 dark:bg-white/5 backdrop-blur-sm",
                      "border border-sky-400/30 dark:border-white/20",
                      "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40",
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
                        <TableCell className="font-mono text-xs text-gray-900 dark:text-gray-100">
                          {order.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-medium",
                              getStatusBadgeClass(order.status ?? ""),
                            )}
                          >
                            {order.status
                              ? order.status.charAt(0).toUpperCase() +
                                order.status.slice(1).toLowerCase()
                              : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-medium",
                              getPaymentBadgeClass(order.paymentStatus ?? ""),
                            )}
                          >
                            {order.paymentStatus
                              ? order.paymentStatus.charAt(0).toUpperCase() +
                                order.paymentStatus.slice(1).toLowerCase()
                              : "—"}
                          </Badge>
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
              </Table>
            </article>
          </>
        )}
      </div>
    </PageContentWrapper>
  );
}
