"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { columns } from "./ProductTableColumns";
import { useClientBrowseMeta, useClientBrowseProducts } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import type {
  Product,
  Category,
  Supplier,
  ClientBrowseMeta,
  ClientBrowseProductsResponse,
} from "@/types";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Users, Truck, FolderTree, Warehouse } from "lucide-react";
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

  const meta = metaQuery.data;
  const productsData = productsQuery.data;

  const admins = meta?.admins ?? [];
  const stats = meta?.stats ?? {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
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
      <div className="pb-6 flex flex-col items-start text-left">
        <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white ">
          Browse & Purchase Products
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Explore products from our store. Filter by category, supplier, or
          status, or choose a product owner to browse their catalog.
        </p>
      </div>

      <div className="pb-6 flex justify-center">
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
