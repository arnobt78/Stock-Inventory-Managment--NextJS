"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { columns } from "./ProductTableColumns";
import { useClientBrowseMeta, useClientBrowseProducts } from "@/hooks/queries";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { PAGE_STATS_GRID_CLASS, APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import type {
  Product,
  Category,
  Supplier,
  ClientBrowseMeta,
  ClientBrowseProductsResponse,
} from "@/types";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Users, Truck, FolderTree, Warehouse, ShoppingBag } from "lucide-react";
import { PageSectionHeader } from "@/components/shared";
import { cn } from "@/lib/utils";
import ProductFilters from "./ProductFilters";

const ProductTable = dynamic(
  () =>
    import("./ProductTable").then((mod) => ({
      default: mod.ProductTable,
    })),
  { ssr: true },
);

export type ClientProductListProps = {
  /** Controlled: parent owns selectedOwnerId */
  selectedOwnerId?: string;
  onOwnerChange?: (ownerId: string) => void;
  /** REQ-0026 — SSR browse meta + default owner products */
  initialBrowseMeta?: ClientBrowseMeta;
  initialBrowseProducts?: ClientBrowseProductsResponse;
  initialOwnerId?: string;
};

export default function ClientProductList({
  selectedOwnerId: controlledOwnerId,
  onOwnerChange,
  initialBrowseMeta,
  initialBrowseProducts,
  initialOwnerId = "",
}: ClientProductListProps = {}) {
  const [internalOwnerId, setInternalOwnerId] =
    useState<string>(initialOwnerId);
  const selectedOwnerId = controlledOwnerId ?? internalOwnerId;
  const setSelectedOwnerId = onOwnerChange ?? setInternalOwnerId;

  const metaQuery = useClientBrowseMeta(initialBrowseMeta);
  const productsQuery = useClientBrowseProducts(
    { ownerId: selectedOwnerId },
    selectedOwnerId === initialOwnerId ? initialBrowseProducts : undefined,
  );

  useSyncSsrQueryData(queryKeys.portal.clientBrowseMeta(), initialBrowseMeta);
  useSyncSsrQueryData(
    queryKeys.portal.clientBrowseProducts({ ownerId: initialOwnerId }),
    selectedOwnerId === initialOwnerId ? initialBrowseProducts : undefined,
  );

  const meta = metaQuery.data;
  const productsData = productsQuery.data;

  const admins = meta?.admins ?? [];
  const stats = meta?.stats ?? {
    storeOwners: { total: 0, withProducts: 0 },
    admins: 0,
    clients: 0,
    suppliers: { total: 0, active: 0, inactive: 0 },
    categories: { total: 0, active: 0, inactive: 0 },
    warehouses: { total: 0, active: 0, inactive: 0 },
  };
  const products = productsData?.products ?? [];
  const ownerCategories = productsData?.categories ?? [];
  const ownerSuppliers = productsData?.suppliers ?? [];

  useEffect(() => {
    if (admins.length > 0 && !selectedOwnerId) {
      const defaultAdmin =
        admins.find((a) => a.email === "test@admin.com") ?? admins[0];
      if (defaultAdmin) setSelectedOwnerId(defaultAdmin.id);
    }
  }, [admins, selectedOwnerId, setSelectedOwnerId]);

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  const productsAsProductType = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        status: p.status as Product["status"],
        createdAt: new Date(p.createdAt),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : null,
      })) as Product[],
    [products],
  );

  // REQ-0021: shell-first — only table data slot pulses
  const tableDataLoading =
    !!selectedOwnerId && isDataSlotLoading(productsQuery);

  return (
    <div className="flex flex-col poppins space-y-4">
      {/* Stat Cards */}
      <div className={cn(PAGE_STATS_GRID_CLASS, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
        <StatisticsCard
          title="Product Owners"
          value={stats.admins}
          description="Admin/User accounts"
          icon={Users}
          variant="sky"
          badges={[
            { label: "Admins", value: stats.admins },
            { label: "Clients", value: stats.clients },
          ]}
        />
        <StatisticsCard
          title="Suppliers"
          value={stats.suppliers.total}
          description="Total suppliers"
          icon={Truck}
          variant="emerald"
          badges={[
            { label: "Active", value: stats.suppliers.active },
            { label: "Inactive", value: stats.suppliers.inactive },
          ]}
        />
        <StatisticsCard
          title="Categories"
          value={stats.categories.total}
          description="Total categories"
          icon={FolderTree}
          variant="amber"
          badges={[
            { label: "Active", value: stats.categories.active },
            { label: "Inactive", value: stats.categories.inactive },
          ]}
        />
        <StatisticsCard
          title="Warehouses"
          value={stats.warehouses.total}
          description="Storage locations"
          icon={Warehouse}
          variant="rose"
          badges={[
            { label: "Active", value: stats.warehouses.active },
            { label: "Inactive", value: stats.warehouses.inactive },
          ]}
        />
      </div>

      {/* Product Inventory Section — client-facing copy */}
      <PageSectionHeader
        as="h2"
        icon={ShoppingBag}
        tone="sky"
        title="Browse & Purchase Products"
        description="Explore products from our store. Filter by category, supplier, or status, or choose a product owner to browse their catalog."
      />

      <div className="pb-2 flex justify-center">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <ProductFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            pagination={pagination}
            setPagination={setPagination}
            allProducts={productsAsProductType}
            allCategories={
              ownerCategories.map((c) => ({
                id: c.id,
                name: c.name,
              })) as Category[]
            }
            allSuppliers={
              ownerSuppliers.map((s) => ({
                id: s.id,
                name: s.name,
              })) as Supplier[]
            }
            categoriesOverride={ownerCategories}
            suppliersOverride={ownerSuppliers}
            hideImport
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedSuppliers={selectedSuppliers}
            setSelectedSuppliers={setSelectedSuppliers}
            userId=""
            productOwnerOptions={admins}
            storeOwnerCounts={stats.storeOwners}
            selectedOwnerId={selectedOwnerId}
            onOwnerChange={setSelectedOwnerId}
          />
        </div>
      </div>

      <ProductTable
        data={productsAsProductType}
        columns={columns}
        userId=""
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        selectedCategory={selectedCategory}
        selectedStatuses={selectedStatuses}
        selectedSuppliers={selectedSuppliers}
      />
    </div>
  );
}
