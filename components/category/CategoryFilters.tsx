"use client";

import React, { useMemo, useCallback } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { FiFileText, FiGrid } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { Search, Download, ChevronDown } from "lucide-react";
import ExcelJS from "exceljs";
import { DeferredSelectGate } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Status filter type
 */
type StatusFilter = "all" | "active" | "inactive";

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
        Notes: category.notes || "-",
        "Created At": category.createdAt
          ? new Date(category.createdAt).toLocaleDateString()
          : "-",
        "Updated At": category.updatedAt
          ? new Date(category.updatedAt).toLocaleDateString()
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
        Notes: category.notes || "-",
        "Created At": category.createdAt
          ? new Date(category.createdAt).toLocaleDateString()
          : "-",
        "Updated At": category.updatedAt
          ? new Date(category.updatedAt).toLocaleDateString()
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
        { header: "Notes", key: "Notes", width: 30 },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
          <Input
            placeholder="Search by Category Name..."
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

        {/* Filters - Middle (Status Filter) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <DeferredSelectGate
            placeholder={
              <div
                className="h-10 w-full sm:w-[180px] rounded-[28px] border border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] font-normal flex items-center justify-between py-2 text-sm"
                aria-hidden
              >
                <span>
                  {statusFilter === "all"
                    ? "All Categories"
                    : statusFilter === "active"
                      ? "Active"
                      : "Inactive"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </div>
            }
          >
            {({ selectRemountKey }) => (
              <Select
                key={selectRemountKey}
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15 dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15 font-normal">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-[28px] border border-sky-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(2,132,199,0.15)]">
                  <SelectItem
                    value="all"
                    className="text-gray-700 dark:text-white/80 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                  >
                    All Categories
                  </SelectItem>
                  <SelectItem
                    value="active"
                    className="text-gray-700 dark:text-white/80 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="text-gray-700 dark:text-white/80 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                  >
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </DeferredSelectGate>
        </div>

        {/* Export Dropdown - Right */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full sm:w-auto flex items-center gap-2 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 dark:from-violet-500/25 dark:via-violet-500/15 dark:to-violet-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(139,92,246,0.2)] backdrop-blur-md transition duration-200 hover:border-violet-300/40 hover:from-violet-500/35 hover:via-violet-500/25 hover:to-violet-500/15 dark:hover:border-violet-300/40 dark:hover:from-violet-500/35 dark:hover:via-violet-500/25 dark:hover:to-violet-500/15"
              >
                <Download className="h-4 w-4" />
                Export Categories
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-[28px] border border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md"
            >
              <DropdownMenuItem
                onClick={exportToCSV}
                className="cursor-pointer text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
              >
                <FiFileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToExcel}
                className="cursor-pointer text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
              >
                <FiGrid className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Area - Active Filters Display */}
      <FilterArea
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}

/**
 * FilterArea Component
 * Displays active filters with reset functionality
 */
function FilterArea({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
}) {
  const hasActiveFilter = statusFilter !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-2 poppins">
      {/* Status Filter */}
      {hasActiveFilter && (
        <div className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/10 to-sky-500/5 text-gray-700 dark:text-white rounded-md backdrop-blur-md shadow-[0_10px_30px_rgba(2,132,199,0.2)]">
          <span className="text-gray-700 dark:text-white/80">Status:</span>
          <div className="flex gap-1 items-center">
            <Badge className="border border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/10 to-sky-500/5 text-white backdrop-blur-md">
              {statusFilter === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <button
            onClick={() => setStatusFilter("all")}
            className="ml-1 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
          >
            <IoClose className="h-3 w-3 text-gray-700 dark:text-white" />
          </button>
        </div>
      )}

      {/* Reset Filters Button */}
      {hasActiveFilter && (
        <Button
          onClick={() => {
            setStatusFilter("all");
          }}
          variant={"ghost"}
          className="p-1 px-2 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur-md"
        >
          <span>Reset</span>
          <IoClose className="h-3 w-3 text-gray-700 dark:text-white" />
        </Button>
      )}
    </div>
  );
}
