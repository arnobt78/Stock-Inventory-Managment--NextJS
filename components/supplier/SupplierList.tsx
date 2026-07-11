"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { createSupplierColumns } from "./SupplierTableColumns";
import { useAuth } from "@/contexts";
import { useSuppliers, useDashboard } from "@/hooks/queries";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import SupplierFilters from "./SupplierFilters";
import AddSupplierDialog from "./SupplierDialog";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Package, DollarSign, Truck, FolderTree } from "lucide-react";
import { PageSectionHeader } from "@/components/shared";
import { Supplier } from "@/types";
import type { SupplierForHome } from "@/lib/server/home-data";
import type { DashboardStats } from "@/types";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Dynamic import for SupplierTable to enable code splitting
 */
const SupplierTable = dynamic(
  () =>
    import("./SupplierTable").then((mod) => ({
      default: mod.SupplierTable,
    })),
  {
    ssr: true,
  },
);

export type SupplierListProps = {
  /** SSR-passed suppliers for first-render hydration (REQ-0021) */
  initialSuppliers?: Supplier[] | SupplierForHome[];
  /** SSR dashboard stats for /suppliers stat cards (REQ-0025 P2) */
  initialStats?: DashboardStats;
};

/**
 * SupplierList Component
 * Main component for displaying and managing suppliers
 * Follows the same pattern as ProductList with consistent spacing
 */
const SupplierList = React.memo(function SupplierList({
  initialSuppliers,
  initialStats,
}: SupplierListProps = {}) {
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const { user } = useAuth();
  const isUserSuppliersPage = pathname === "/suppliers";
  const suppliersQuery = useSuppliers(initialSuppliers);
  const dashboardQuery = useDashboard(initialStats);
  const allSuppliers = suppliersQuery.data ?? [];

  useSyncSsrQueryData(queryKeys.suppliers.lists(), initialSuppliers);
  useSyncSsrQueryData(
    queryKeys.dashboard.overview(user?.id ?? ""),
    isUserSuppliersPage && user?.id && initialStats !== undefined
      ? initialStats
      : undefined,
  );

  const suppliersPageStats = isUserSuppliersPage
    ? (dashboardQuery.data ?? null)
    : null;

  // Mark component as mounted after client-side hydration
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  // State for search term and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });

  // State for status filter (all, active, inactive)
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // State for controlling edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // REQ-0021: shell-first — only data slots pulse
  const tableDataLoading = isDataSlotLoading(suppliersQuery, initialSuppliers);
  const cardsDataLoading = isUserSuppliersPage
    ? isDataSlotLoading(dashboardQuery, initialStats)
    : false;

  // Create table columns with edit handler
  const handleEditSupplier = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => createSupplierColumns(handleEditSupplier),
    [handleEditSupplier],
  );

  // Always render the UI structure to prevent flashing
  // Only the table will show skeleton during initial load
  return (
    <div className="flex flex-col poppins">
      {/* Supplier Management Section Header — same alignment as products page */}
      <PageSectionHeader
        as="h2"
        icon={Truck}
        tone="teal"
        className="pb-6"
        title="Supplier Management"
        description="Manage your supplier relationships efficiently. Track supplier information, status, and maintain detailed records for better inventory management and procurement planning."
      />

      {/* Store-wide state cards — only on /suppliers page (user), same as homepage/products */}
      {isUserSuppliersPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
          <StatisticsCard
            title="Total Products"
            value={suppliersPageStats?.counts.products ?? 0}
            description="Products availability"
            icon={Package}
            variant="rose"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Available",
                value:
                  suppliersPageStats?.productStatusBreakdown?.available ?? 0,
              },
              {
                label: "Stock low",
                value:
                  suppliersPageStats?.productStatusBreakdown?.stockLow ?? 0,
              },
              {
                label: "Stock out",
                value:
                  suppliersPageStats?.productStatusBreakdown?.stockOut ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Value"
            value={formatCurrency(suppliersPageStats?.totalInventoryValue ?? 0)}
            description="Total inventory value"
            icon={DollarSign}
            variant="violet"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Orders",
                value: formatCurrency(
                  suppliersPageStats?.orderAnalytics
                    ?.totalRevenueExcludingCancelled ??
                    suppliersPageStats?.revenue?.fromOrders ??
                    0,
                ),
              },
              {
                label: "Invoices",
                value: formatCurrency(
                  suppliersPageStats?.revenue?.fromInvoices ?? 0,
                ),
              },
              {
                label: "Due",
                value: formatCurrency(
                  suppliersPageStats?.invoiceAnalytics?.outstandingAmount ?? 0,
                ),
              },
              {
                label: "Cancelled",
                value: formatCurrency(
                  suppliersPageStats?.orderAnalytics?.cancelledOrderAmount ?? 0,
                ),
              },
            ]}
          />
          <StatisticsCard
            title="Total Suppliers"
            value={suppliersPageStats?.counts.suppliers ?? 0}
            description="Suppliers"
            icon={Truck}
            variant="emerald"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Active",
                value: suppliersPageStats?.supplierStatusBreakdown?.active ?? 0,
              },
              {
                label: "Inactive",
                value:
                  suppliersPageStats?.supplierStatusBreakdown?.inactive ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Categories"
            value={suppliersPageStats?.counts.categories ?? 0}
            description="Product categories"
            icon={FolderTree}
            variant="amber"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Active",
                value: suppliersPageStats?.categoryStatusBreakdown?.active ?? 0,
              },
              {
                label: "Inactive",
                value:
                  suppliersPageStats?.categoryStatusBreakdown?.inactive ?? 0,
              },
            ]}
          />
        </div>
      )}

      {/* Filters and Actions - Always visible, only disabled during auth check */}
      <div className="pb-6 flex justify-center">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <SupplierFilters
            allSuppliers={allSuppliers}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            pagination={pagination}
            setPagination={setPagination}
            userId={user?.id || ""}
          />
        </div>
      </div>

      {/* Supplier Table - Shows skeleton during auth check or data loading */}
      <SupplierTable
        data={allSuppliers || []}
        columns={columns}
        userId={user?.id || ""}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        statusFilter={statusFilter}
      />

      {/* Controlled Edit Dialog - only mount after client hydration to avoid Radix ID mismatch */}
      {isMounted && (
        <AddSupplierDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setEditingSupplier(null);
            }
          }}
          editingSupplier={editingSupplier}
          onEditSupplier={(supplier) => {
            setEditingSupplier(supplier);
          }}
        >
          <div style={{ display: "none" }} />
        </AddSupplierDialog>
      )}
    </div>
  );
});

SupplierList.displayName = "SupplierList";

export default SupplierList;
