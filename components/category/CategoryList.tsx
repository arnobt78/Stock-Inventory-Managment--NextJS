"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { createCategoryColumns } from "./CategoryTableColumns";
import { useAuth } from "@/contexts";
import { useCategories, useDashboard } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import CategoryFilters from "./CategoryFilters";
import AddCategoryDialog from "./CategoryDialog";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Package, DollarSign, Truck, FolderTree } from "lucide-react";
import { PageSectionHeader } from "@/components/shared";
import { Category } from "@/types";
import type { CategoryForHome } from "@/lib/server/home-data";
import type { DashboardStats } from "@/types";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CategoryTable = dynamic(
  () =>
    import("./CategoryTable").then((mod) => ({
      default: mod.CategoryTable,
    })),
  { ssr: true },
);

export type CategoryListProps = {
  /** SSR-passed categories for first-render hydration (REQ-0021) */
  initialCategories?: Category[] | CategoryForHome[];
  /** SSR dashboard stats for /categories stat cards (REQ-0025 P2) */
  initialStats?: DashboardStats;
};

const CategoryList = React.memo(function CategoryList({
  initialCategories,
  initialStats,
}: CategoryListProps = {}) {
  const pathname = usePathname();
  const categoriesQuery = useCategories(initialCategories);
  const dashboardQuery = useDashboard(initialStats);
  const allCategories = categoriesQuery.data ?? [];
  const isUserCategoriesPage = pathname === "/categories";
  const categoriesPageStats = isUserCategoriesPage
    ? (dashboardQuery.data ?? null)
    : null;
  const cardsDataLoading = isUserCategoriesPage
    ? isDataSlotLoading(dashboardQuery, initialStats)
    : false;
  const tableDataLoading = isDataSlotLoading(
    categoriesQuery,
    initialCategories,
  );

  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => createCategoryColumns(handleEditCategory),
    [handleEditCategory],
  );

  return (
    <div className="flex flex-col poppins">
      <PageSectionHeader
        as="h2"
        icon={FolderTree}
        tone="amber"
        className="pb-6"
        title="Category Management"
        description="Organize your inventory with a comprehensive category system. Create, manage, and maintain product categories to streamline your inventory organization and improve product discoverability."
      />

      {isUserCategoriesPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
          <StatisticsCard
            title="Total Products"
            value={categoriesPageStats?.counts.products ?? 0}
            description="Products availability"
            icon={Package}
            variant="rose"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Available",
                value:
                  categoriesPageStats?.productStatusBreakdown?.available ?? 0,
              },
              {
                label: "Stock low",
                value:
                  categoriesPageStats?.productStatusBreakdown?.stockLow ?? 0,
              },
              {
                label: "Stock out",
                value:
                  categoriesPageStats?.productStatusBreakdown?.stockOut ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Total Value"
            value={formatCurrency(
              categoriesPageStats?.totalInventoryValue ?? 0,
            )}
            description="Total inventory value"
            icon={DollarSign}
            variant="violet"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Orders",
                value: formatCurrency(
                  categoriesPageStats?.orderAnalytics
                    ?.totalRevenueExcludingCancelled ??
                    categoriesPageStats?.revenue?.fromOrders ??
                    0,
                ),
              },
              {
                label: "Invoices",
                value: formatCurrency(
                  categoriesPageStats?.revenue?.fromInvoices ?? 0,
                ),
              },
              {
                label: "Due",
                value: formatCurrency(
                  categoriesPageStats?.invoiceAnalytics?.outstandingAmount ?? 0,
                ),
              },
              {
                label: "Cancelled",
                value: formatCurrency(
                  categoriesPageStats?.orderAnalytics?.cancelledOrderAmount ??
                    0,
                ),
              },
            ]}
          />
          <StatisticsCard
            title="Total Suppliers"
            value={categoriesPageStats?.counts.suppliers ?? 0}
            description="Suppliers"
            icon={Truck}
            variant="emerald"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Active",
                value:
                  categoriesPageStats?.supplierStatusBreakdown?.active ?? 0,
              },
              {
                label: "Inactive",
                value:
                  categoriesPageStats?.supplierStatusBreakdown?.inactive ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title="Categories"
            value={categoriesPageStats?.counts.categories ?? 0}
            description="Product categories"
            icon={FolderTree}
            variant="amber"
            valueLoading={cardsDataLoading}
            badgeValuesLoading={cardsDataLoading}
            badges={[
              {
                label: "Active",
                value:
                  categoriesPageStats?.categoryStatusBreakdown?.active ?? 0,
              },
              {
                label: "Inactive",
                value:
                  categoriesPageStats?.categoryStatusBreakdown?.inactive ?? 0,
              },
            ]}
          />
        </div>
      )}

      <div className="pb-6 flex justify-center">
        <div className="w-full max-w-9xl">
          <CategoryFilters
            allCategories={allCategories}
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

      <CategoryTable
        data={allCategories || []}
        columns={columns}
        userId={user?.id || ""}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        statusFilter={statusFilter}
      />

      <AddCategoryDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
          }
        }}
        editingCategory={editingCategory}
        onEditCategory={(category) => {
          setEditingCategory(category);
        }}
      >
        <div style={{ display: "none" }} />
      </AddCategoryDialog>
    </div>
  );
});

CategoryList.displayName = "CategoryList";

export default CategoryList;
