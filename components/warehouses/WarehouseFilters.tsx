"use client";

import { FILTER_SEARCH_INPUT_TEAL_CLASS } from "@/lib/ui/filter-toolbar-styles";

import React, { useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { Warehouse } from "@/types";
import { PaginationType } from "@/components/shared/PaginationSelector";
import {
  ActiveInactiveFilterChips,
  CatalogActiveInactiveSelect,
  ExportMenuButton,
} from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import type { CatalogStatusFilter } from "@/lib/ui/catalog-filter-tokens";

type StatusFilter = CatalogStatusFilter;

type WarehouseFiltersProps = {
  allWarehouses: Warehouse[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
};

export default function WarehouseFilters({
  allWarehouses,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
}: WarehouseFiltersProps) {
  const { toast } = useToast();

  /**
   * Filter warehouses based on current filters
   */
  const filteredWarehouses = useMemo(() => {
    return allWarehouses.filter((warehouse) => {
      const searchMatch =
        !searchTerm ||
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (warehouse.address &&
          warehouse.address.toLowerCase().includes(searchTerm.toLowerCase()));

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && warehouse.status === true) ||
        (statusFilter === "inactive" && warehouse.status === false);

      return searchMatch && statusMatch;
    });
  }, [allWarehouses, searchTerm, statusFilter]);

  /**
   * Export filtered warehouses to CSV
   */
  const exportToCSV = useCallback(() => {
    try {
      if (filteredWarehouses.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no warehouses to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const csvData = filteredWarehouses.map((warehouse) => ({
        Name: warehouse.name,
        Status: warehouse.status ? "Active" : "Inactive",
        Address: warehouse.address || "-",
        Type: warehouse.type || "-",
        "Created At": warehouse.createdAt
          ? new Date(warehouse.createdAt).toLocaleDateString()
          : "-",
        "Updated At": warehouse.updatedAt
          ? new Date(warehouse.updatedAt).toLocaleDateString()
          : "-",
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `warehouses_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredWarehouses.length} warehouse(s) exported to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export warehouses to CSV",
        variant: "destructive",
      });
    }
  }, [filteredWarehouses, toast]);

  /**
   * Export filtered warehouses to Excel
   */
  const exportToExcel = useCallback(async () => {
    try {
      if (filteredWarehouses.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no warehouses to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const excelData = filteredWarehouses.map((warehouse) => ({
        Name: warehouse.name,
        Status: warehouse.status ? "Active" : "Inactive",
        Address: warehouse.address || "-",
        Type: warehouse.type || "-",
        "Created At": warehouse.createdAt
          ? new Date(warehouse.createdAt).toLocaleDateString()
          : "-",
        "Updated At": warehouse.updatedAt
          ? new Date(warehouse.updatedAt).toLocaleDateString()
          : "-",
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Warehouses");

      worksheet.columns = [
        { header: "Name", key: "Name", width: 25 },
        { header: "Status", key: "Status", width: 12 },
        { header: "Address", key: "Address", width: 40 },
        { header: "Type", key: "Type", width: 15 },
        { header: "Created At", key: "Created At", width: 12 },
        { header: "Updated At", key: "Updated At", width: 12 },
      ];

      worksheet.addRows(excelData);

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `warehouses_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredWarehouses.length} warehouse(s) exported to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export warehouses to Excel",
        variant: "destructive",
      });
    }
  }, [filteredWarehouses, toast]);

  return (
    <div className="flex flex-col gap-2">
      {/* Single Row: Search (Left) | Filters (Middle) | Export (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Bar - Left */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
          <Input
            placeholder="Search by name or address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className={FILTER_SEARCH_INPUT_TEAL_CLASS}
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

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <CatalogActiveInactiveSelect
            entity="warehouse"
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>

        <div className="flex-shrink-0">
          <ExportMenuButton
            label="Export Warehouses"
            accent="teal"
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
