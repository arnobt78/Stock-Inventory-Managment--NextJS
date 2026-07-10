"use client";

import React, { useMemo, useCallback } from "react";
import { Product, Category, Supplier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { IoClose } from "react-icons/io5";
import { Search, Users } from "lucide-react";
import ExcelJS from "exceljs";
import { CategoryDropDown } from "@/components/category/CategoryFilter";
import { StatusDropDown } from "./ProductStatusFilter";
import { SuppliersDropDown } from "@/components/supplier/SupplierFilter";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { DismissibleFilterChips, ExportMenuButton } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { ProductImportDialog } from "./ProductImportDialog";
import { ProductOwnerSelect } from "./ProductOwnerSelect";
import { ProductStockStatusBadge } from "@/lib/ui/semantic-badges";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";

type FiltersAndActionsProps = {
  allProducts: Product[];
  allCategories: Category[];
  allSuppliers: Supplier[];
  /** When provided, pass to CategoryDropDown (e.g. client browse mode) */
  categoriesOverride?: Array<{ id: string; name: string }>;
  /** When provided, pass to SuppliersDropDown (e.g. client browse mode) */
  suppliersOverride?: Array<{ id: string; name: string }>;
  /** When true, hide Import (e.g. client browse mode) */
  hideImport?: boolean;
  /** When provided (e.g. client browse), show Product Owner dropdown in filter row */
  productOwnerOptions?: Array<{ id: string; name: string; email: string }>;
  selectedOwnerId?: string;
  onOwnerChange?: (ownerId: string) => void;
  selectedCategory: string[];
  setSelectedCategory: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSuppliers: string[];
  setSelectedSuppliers: React.Dispatch<React.SetStateAction<string[]>>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
  userId: string;
};

export default function FiltersAndActions({
  allProducts,
  allCategories,
  allSuppliers,
  categoriesOverride,
  suppliersOverride,
  hideImport = false,
  productOwnerOptions,
  selectedOwnerId = "",
  onOwnerChange,
  selectedCategory,
  setSelectedCategory,
  selectedStatuses,
  setSelectedStatuses,
  selectedSuppliers,
  setSelectedSuppliers,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  userId,
}: FiltersAndActionsProps) {
  const { toast } = useToast();

  /**
   * Filter products based on current filters
   * Memoized to prevent unnecessary recalculations
   */
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const searchMatch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch =
        selectedCategory.length === 0 ||
        selectedCategory.includes(product.categoryId ?? "");
      const supplierMatch =
        selectedSuppliers.length === 0 ||
        selectedSuppliers.includes(product.supplierId ?? "");
      const statusMatch =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(product.status ?? "");
      return searchMatch && categoryMatch && supplierMatch && statusMatch;
    });
  }, [
    allProducts,
    searchTerm,
    selectedCategory,
    selectedSuppliers,
    selectedStatuses,
  ]);

  /**
   * Export filtered products to CSV
   * Memoized callback to prevent unnecessary re-renders
   */
  const exportToCSV = useCallback(() => {
    try {
      if (filteredProducts.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no products to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const csvData = filteredProducts.map((product) => ({
        "Product Name": product.name,
        SKU: product.sku,
        Price: `$${product.price.toFixed(2)}`,
        Quantity: product.quantity,
        Status: product.status,
        Category: product.category || "Unknown",
        Supplier: product.supplier || "Unknown",
        "Created Date": new Date(product.createdAt).toLocaleDateString(),
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `stockly-products-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV Export Successful!",
        description: `${filteredProducts.length} products exported to CSV file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export products to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredProducts, toast]);

  /**
   * Export filtered products to Excel
   * Memoized callback to prevent unnecessary re-renders
   */
  const exportToExcel = useCallback(async () => {
    try {
      if (filteredProducts.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no products to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const excelData = filteredProducts.map((product) => ({
        "Product Name": product.name,
        SKU: product.sku,
        Price: product.price,
        Quantity: product.quantity,
        Status: product.status,
        Category: product.category || "Unknown",
        Supplier: product.supplier || "Unknown",
        "Created Date": new Date(product.createdAt).toLocaleDateString(),
      }));

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Products");

      // Add header row
      worksheet.columns = [
        { header: "Product Name", key: "Product Name", width: 20 },
        { header: "SKU", key: "SKU", width: 15 },
        { header: "Price", key: "Price", width: 10 },
        { header: "Quantity", key: "Quantity", width: 10 },
        { header: "Status", key: "Status", width: 12 },
        { header: "Category", key: "Category", width: 15 },
        { header: "Supplier", key: "Supplier", width: 15 },
        { header: "Created Date", key: "Created Date", width: 12 },
      ];

      // Add data rows
      worksheet.addRows(excelData);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Generate Excel file and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `stockly-products-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Excel Export Successful!",
        description: `${filteredProducts.length} products exported to Excel file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export products to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredProducts, toast]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedCategory([]);
    setSelectedSuppliers([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setSelectedStatuses, setSelectedCategory, setSelectedSuppliers, setPagination]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const categoryNameById = new Map(allCategories.map((c) => [c.id, c.name]));
    const supplierNameById = new Map(allSuppliers.map((s) => [s.id, s.name]));

    return [
      {
        label: "Status",
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <ProductStockStatusBadge status={value} size="compact" />
        ),
      },
      {
        label: "Category",
        values: selectedCategory,
        onClear: () => setSelectedCategory([]),
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {categoryNameById.get(value) ?? value}
          </span>
        ),
      },
      {
        label: "Supplier",
        values: selectedSuppliers,
        onClear: () => setSelectedSuppliers([]),
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {supplierNameById.get(value) ?? value}
          </span>
        ),
      },
    ];
  }, [
    allCategories,
    allSuppliers,
    selectedStatuses,
    selectedCategory,
    selectedSuppliers,
    setSelectedStatuses,
    setSelectedCategory,
    setSelectedSuppliers,
  ]);

  const exportButtonClass =
    "h-10 w-full sm:w-auto flex items-center gap-2 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 dark:from-violet-500/25 dark:via-violet-500/15 dark:to-violet-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(139,92,246,0.2)] backdrop-blur-md transition duration-200 hover:border-violet-300/40 hover:from-violet-500/35 hover:via-violet-500/25 hover:to-violet-500/15 dark:hover:border-violet-300/40 dark:hover:from-violet-500/35 dark:hover:via-violet-500/25 dark:hover:to-violet-500/15";

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Select Product Owner (when client) - centered */}
      {productOwnerOptions && onOwnerChange && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-2 w-full">
          <span className="text-sm font-medium text-gray-700 dark:text-white/80 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600 dark:text-white/60 flex-shrink-0" />
            Select Product Owner
          </span>
          <ProductOwnerSelect
            options={productOwnerOptions}
            selectedOwnerId={selectedOwnerId}
            onOwnerChange={onOwnerChange}
            triggerClassName={exportButtonClass}
          />
        </div>
      )}

      {/* Row 2: Left: Suppliers, Categories | Center: Search | Right: Status, Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-wrap w-full">
        {/* Left */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 order-2 sm:order-1 w-full sm:w-auto">
          <SuppliersDropDown
            selectedSuppliers={selectedSuppliers}
            setSelectedSuppliers={setSelectedSuppliers}
            suppliersOverride={suppliersOverride}
          />
          <CategoryDropDown
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categoriesOverride={categoriesOverride}
          />
        </div>

        {/* Center - Search */}
        <div className="relative flex-1 min-w-[120px] sm:min-w-[200px] sm:max-w-md w-full order-1 sm:order-2 sm:flex sm:justify-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
            <Input
              placeholder="Search by Name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-md border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-md"
              >
                <IoClose className="h-4 w-4 text-gray-700 dark:text-white/60" />
              </Button>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 order-3 w-full sm:w-auto sm:flex-wrap">
          <StatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
          {!hideImport && <ProductImportDialog />}
          <ExportMenuButton
            label="Export Products"
            accent="violet"
            onExportCsv={exportToCSV}
            onExportExcel={exportToExcel}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <DismissibleFilterChips
        groups={filterChipGroups}
        onReset={handleResetFilters}
      />
    </div>
  );
}
