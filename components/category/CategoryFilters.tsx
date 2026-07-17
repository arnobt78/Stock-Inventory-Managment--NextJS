"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useMemo, useCallback } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { IoClose } from "react-icons/io5";
import { Search } from "lucide-react";
import ExcelJS from "exceljs";
import {
  ActiveInactiveFilterChips,
  CatalogActiveInactiveSelect,
  ExportMenuButton,
} from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import type { CatalogStatusFilter } from "@/lib/ui/catalog-filter-tokens";
import { formatStableDate } from "@/lib/format";

type StatusFilter = CatalogStatusFilter;

/**
 * Props for CategoryFilters component
 */
type CategoryFiltersProps = {
  allCategories: Category[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
  userId: string;
};

/**
 * CategoryFilters Component
 * Provides search, filter, and export functionality for categories table
 */
export default function CategoryFilters({
  allCategories,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  userId,
}: CategoryFiltersProps) {
  const { toast } = useToast();

  /**
   * Filter categories based on current filters
   * Memoized to prevent unnecessary recalculations
   */
  const filteredCategories = useMemo(() => {
    return allCategories.filter((category) => {
      const searchMatch =
        !searchTerm ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter: all, active, or inactive
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && category.status === true) ||
        (statusFilter === "inactive" && category.status === false);

      return searchMatch && statusMatch;
    });
  }, [allCategories, searchTerm, statusFilter]);

  /**
   * Export filtered categories to CSV
   * Memoized callback to prevent unnecessary re-renders
   */
  const exportToCSV = useCallback(() => {
    try {
      if (filteredCategories.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no categories to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for CSV export
      const csvData = filteredCategories.map((category) => ({
        Name: category.name,
        Status: category.status ? "Active" : "Inactive",
        Description: category.description || "-",
        Products: category.productCount ?? 0,
        "Created At": category.createdAt
          ? formatStableDate(category.createdAt)
          : "-",
        "Updated At": category.updatedAt
          ? formatStableDate(category.updatedAt)
          : "-",
      }));

      // Convert to CSV
      const csv = Papa.unparse(csvData);

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `categories_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredCategories.length} category(ies) exported to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export categories to CSV",
        variant: "destructive",
      });
    }
  }, [filteredCategories, toast]);

  /**
   * Export filtered categories to Excel
   * Memoized callback to prevent unnecessary re-renders
   */
  const exportToExcel = useCallback(async () => {
    try {
      if (filteredCategories.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no categories to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for Excel export
      const excelData = filteredCategories.map((category) => ({
        Name: category.name,
        Status: category.status ? "Active" : "Inactive",
        Description: category.description || "-",
        Products: category.productCount ?? 0,
        "Created At": category.createdAt
          ? formatStableDate(category.createdAt)
          : "-",
        "Updated At": category.updatedAt
          ? formatStableDate(category.updatedAt)
          : "-",
      }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Categories");

      // Add header row with column widths
      worksheet.columns = [
        { header: "Name", key: "Name", width: 25 },
        { header: "Status", key: "Status", width: 12 },
        { header: "Description", key: "Description", width: 30 },
        { header: "Products", key: "Products", width: 12 },
        { header: "Created At", key: "Created At", width: 12 },
        { header: "Updated At", key: "Updated At", width: 12 },
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
        `categories_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredCategories.length} category(ies) exported to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export categories to Excel",
        variant: "destructive",
      });
    }
  }, [filteredCategories, toast]);

  return (
    <div className="flex flex-col">
      {/* Single Row: Search (Left) | Filters (Middle) | Export (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Bar - Left */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder="Search by Category Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-md"
            >
              <IoClose className="h-4 w-4 text-gray-700 dark:text-white/80" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <CatalogActiveInactiveSelect
            entity="category"
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        </div>

        <div className="flex-shrink-0">
          <ExportMenuButton
            label="Export Categories"
            accent="violet"
            onExportCsv={exportToCSV}
            onExportExcel={exportToExcel}
          />
        </div>
      </div>

      <ActiveInactiveFilterChips
        statusFilter={statusFilter}
        onClear={() => {
          setStatusFilter("all");
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        onReset={() => {
          setStatusFilter("all");
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
      />
    </div>
  );
}
