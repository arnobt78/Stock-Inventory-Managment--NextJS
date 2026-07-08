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
import { createWarehouseColumns } from "./WarehouseTableColumns";
import { useWarehouses, useDashboard } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import WarehouseFilters from "./WarehouseFilters";
import WarehouseDialog from "./WarehouseDialog";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Package, Warehouse as WarehouseIcon } from "lucide-react";
import { Warehouse } from "@/types";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";

const WarehouseTable = dynamic(
  () =>
    import("./WarehouseTable").then((mod) => ({
      default: mod.WarehouseTable,
    })),
  { ssr: true },
);

export type WarehouseListProps = {
  /** SSR-passed warehouses for first-render hydration (REQ-0021) */
  initialWarehouses?: Warehouse[] | WarehouseForPage[];
};

export default function WarehouseList({
  initialWarehouses,
}: WarehouseListProps = {}) {
  const pathname = usePathname();
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  const warehousesQuery = useWarehouses(initialWarehouses);
  const dashboardQuery = useDashboard();
  const allWarehouses = warehousesQuery.data ?? [];

  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const dashboard = isAdmin ? (dashboardQuery.data ?? null) : null;
  /** Show store-wide state cards only on the user warehouses page (/warehouses), not admin or homepage */
  const isUserWarehousesPage = pathname === "/warehouses";
  const warehousesPageStats = isUserWarehousesPage
    ? (dashboardQuery.data ?? null)
    : null;

  const warehouseTypeBadges = useMemo(() => {
    const dist = dashboard?.warehouseAnalytics?.typeDistribution ?? [];
    const typeMap = new Map(
      dist.map((t) => [(t.type ?? "").toLowerCase().trim(), t.count]),
    );
    const knownTypes = ["main", "secondary", "storage", "hub", "store"];
    const othersCount = [...typeMap.entries()].reduce(
      (sum, [k, v]) => (knownTypes.includes(k) ? sum : sum + v),
      0,
    );
    return [
      { label: "Main", value: typeMap.get("main") ?? 0 },
      { label: "Secondary", value: typeMap.get("secondary") ?? 0 },
      { label: "Storage", value: typeMap.get("storage") ?? 0 },
      { label: "Hub", value: typeMap.get("hub") ?? 0 },
      { label: "Store", value: typeMap.get("store") ?? 0 },
      { label: "Others", value: othersCount },
    ];
  }, [dashboard?.warehouseAnalytics?.typeDistribution]);

  /** Type badges for user /warehouses page cards (from dashboard stats) */
  const warehousesPageTypeBadges = useMemo(() => {
    const dist =
      warehousesPageStats?.warehouseAnalytics?.typeDistribution ?? [];
    const typeMap = new Map(
      dist.map((t) => [(t.type ?? "").toLowerCase().trim(), t.count]),
    );
    const knownTypes = ["main", "secondary", "storage", "hub", "store"];
    const othersCount = [...typeMap.entries()].reduce(
      (sum, [k, v]) => (knownTypes.includes(k) ? sum : sum + v),
      0,
    );
    return [
      { label: "Main", value: typeMap.get("main") ?? 0 },
      { label: "Secondary", value: typeMap.get("secondary") ?? 0 },
      { label: "Storage", value: typeMap.get("storage") ?? 0 },
      { label: "Hub", value: typeMap.get("hub") ?? 0 },
      { label: "Store", value: typeMap.get("store") ?? 0 },
      { label: "Others", value: othersCount },
    ];
  }, [warehousesPageStats?.warehouseAnalytics?.typeDistribution]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  // REQ-0021: shell-first — only data slots pulse
  const tableDataLoading = isDataSlotLoading(
    warehousesQuery,
    initialWarehouses,
  );
  const userCardsDataLoading = isUserWarehousesPage
    ? isDataSlotLoading(dashboardQuery)
    : false;
  const adminCardsDataLoading = isAdmin
    ? isDataSlotLoading(dashboardQuery)
    : false;

  const handleEditWarehouse = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setEditDialogOpen(true);
  }, []);

  const detailBase = pathname?.startsWith("/admin") ? "/admin" : "";
  const columns = useMemo(
    () => createWarehouseColumns(handleEditWarehouse, detailBase),
    [handleEditWarehouse, detailBase],
  );

  return (
    <div className="flex flex-col poppins">
      {/* Warehouse Management Section Header */}
      <div className="pb-6 flex flex-col items-start text-left">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white ">
          Warehouse Management
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Manage warehouse locations. Add, edit, and track warehouses for
          multi-location inventory. Stock allocation and inter-warehouse
          transfers are not yet implemented—you can create and edit warehouses
          now; assigning stock to locations and moving stock between warehouses
          will be available in a future update.
        </p>
      </div>

      {/* Store-wide state cards — only on /warehouses page (user), same style as homepage/products */}
      {isUserWarehousesPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
          <StatisticsCard
            title="Total Products"
            value={warehousesPageStats?.counts.products ?? 0}
            description="Products availability"
            icon={Package}
            variant="rose"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={[
              {
                label: "Available",
                value:
                  warehousesPageStats?.productStatusBreakdown?.available ?? 0,
              },
              {
                label: "Stock low",
                value:
                  warehousesPageStats?.productStatusBreakdown?.stockLow ?? 0,
              },
              {
                label: "Stock out",
                value:
                  warehousesPageStats?.productStatusBreakdown?.stockOut ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Warehouses"
            value={
              warehousesPageStats?.warehouseAnalytics?.totalWarehouses ?? 0
            }
            description="All locations"
            icon={WarehouseIcon}
            variant="teal"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={[
              {
                label: "Active",
                value:
                  warehousesPageStats?.warehouseAnalytics?.activeWarehouses ??
                  0,
              },
              {
                label: "Inactive",
                value:
                  warehousesPageStats?.warehouseAnalytics?.inactiveWarehouses ??
                  0,
              },
            ]}
          />
          <StatisticsCard
            title="Active Warehouses"
            value={
              warehousesPageStats?.warehouseAnalytics?.activeWarehouses ?? 0
            }
            description="Operational"
            icon={WarehouseIcon}
            variant="emerald"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={warehousesPageTypeBadges}
          />
          <StatisticsCard
            title="Inactive Warehouses"
            value={
              warehousesPageStats?.warehouseAnalytics?.inactiveWarehouses ?? 0
            }
            description="Not in use"
            icon={WarehouseIcon}
            variant="rose"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={warehousesPageTypeBadges}
          />
        </div>
      )}

      {/* Summary cards — admin only (same as dashboard Warehouse Analytics) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-6 items-stretch">
          <StatisticsCard
            title="Total Warehouses"
            value={dashboard?.warehouseAnalytics?.totalWarehouses ?? 0}
            description="All locations"
            icon={WarehouseIcon}
            variant="teal"
            valueLoading={adminCardsDataLoading}
            badgeValuesLoading={adminCardsDataLoading}
            badges={[
              {
                label: "Active",
                value: dashboard?.warehouseAnalytics?.activeWarehouses ?? 0,
              },
              {
                label: "Inactive",
                value: dashboard?.warehouseAnalytics?.inactiveWarehouses ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Active Warehouses"
            value={dashboard?.warehouseAnalytics?.activeWarehouses ?? 0}
            description="Operational"
            icon={WarehouseIcon}
            variant="emerald"
            valueLoading={adminCardsDataLoading}
            badgeValuesLoading={adminCardsDataLoading}
            badges={warehouseTypeBadges}
          />
          <StatisticsCard
            title="Inactive Warehouses"
            value={dashboard?.warehouseAnalytics?.inactiveWarehouses ?? 0}
            description="Not in use"
            icon={WarehouseIcon}
            variant="rose"
            valueLoading={adminCardsDataLoading}
            badgeValuesLoading={adminCardsDataLoading}
            badges={warehouseTypeBadges}
          />
        </div>
      )}

      {/* Filters and Actions - Always visible, only disabled during auth check */}
      <div className="pb-6 flex justify-center">
        <div className="w-full max-w-9xl">
          <WarehouseFilters
            allWarehouses={allWarehouses}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            pagination={pagination}
            setPagination={setPagination}
          />
        </div>
      </div>

      <WarehouseTable
        data={allWarehouses}
        columns={columns}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        statusFilter={statusFilter}
      />

      {/* Defer Dialog until mount to avoid Radix aria-controls hydration mismatch */}
      {isMounted && (
        <WarehouseDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingWarehouse(null);
          }}
          editingWarehouse={editingWarehouse}
          onEditWarehouse={(w) => setEditingWarehouse(w)}
        >
          <div style={{ display: "none" }} />
        </WarehouseDialog>
      )}
    </div>
  );
}
