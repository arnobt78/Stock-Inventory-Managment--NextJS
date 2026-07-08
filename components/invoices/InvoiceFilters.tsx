/**
 * Invoice Filters Component
 * Search and filter controls for invoices with export functionality
 * Matches Order/Product section UI patterns with Status dropdown and Export dropdown
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, ChevronDown } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { FiFileText, FiGrid } from "react-icons/fi";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToCSV } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceStatusDropDown } from "./InvoiceStatusFilter";
import {
  InvoiceSourceDropDown,
  type InvoiceSourceFilterValue,
} from "./InvoiceSourceFilter";
import type { Invoice } from "@/types";

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (pagination: PaginationType) => void;
  allInvoices: Invoice[];
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  /** When set, show Invoice type filter (Client / Personal / View both) */
  showInvoiceSourceFilter?: boolean;
  invoiceSourceFilter?: InvoiceSourceFilterValue;
  setInvoiceSourceFilter?: (value: InvoiceSourceFilterValue) => void;
}

export default function InvoiceFilters({
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  allInvoices,
  selectedStatuses,
  setSelectedStatuses,
  showInvoiceSourceFilter,
  invoiceSourceFilter = "both",
  setInvoiceSourceFilter,
}: InvoiceFiltersProps) {
  const { toast } = useToast();

  /**
   * Filter invoices based on search term and selected filters
   */
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((invoice) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.notes &&
          invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(invoice.status);

      return matchesSearch && matchesStatus;
    });
  }, [allInvoices, searchTerm, selectedStatuses]);

  /**
   * Export filtered invoices to CSV
   * Memoized callback to prevent unnecessary re-renders
   */
  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredInvoices.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no invoices to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const csvData = filteredInvoices.map((invoice) => ({
        "Invoice Number": invoice.invoiceNumber,
        "Invoice Date": new Date(invoice.createdAt).toLocaleDateString(),
        Status: invoice.status,
        Subtotal: invoice.subtotal.toFixed(2),
        Tax: invoice.tax ? invoice.tax.toFixed(2) : "0.00",
        Discount: invoice.discount ? invoice.discount.toFixed(2) : "0.00",
        Total: invoice.total.toFixed(2),
        "Amount Paid": invoice.amountPaid.toFixed(2),
        "Amount Due": invoice.amountDue.toFixed(2),
        "Due Date": new Date(invoice.dueDate).toLocaleDateString(),
      }));

      const columns = [
        { header: "Invoice Number", key: "Invoice Number" },
        { header: "Invoice Date", key: "Invoice Date" },
        { header: "Status", key: "Status" },
        { header: "Subtotal", key: "Subtotal" },
        { header: "Tax", key: "Tax" },
        { header: "Discount", key: "Discount" },
        { header: "Total", key: "Total" },
        { header: "Amount Paid", key: "Amount Paid" },
        { header: "Amount Due", key: "Amount Due" },
        { header: "Due Date", key: "Due Date" },
      ];

      exportToCSV(csvData, columns, "stockly-invoices");

      toast({
        title: "CSV Export Successful!",
        description: `${filteredInvoices.length} invoices exported to CSV file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export invoices to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredInvoices, toast]);

  /**
   * Export filtered invoices to Excel
   * Memoized callback to prevent unnecessary re-renders
   */
  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredInvoices.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no invoices to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const excelData = filteredInvoices.map((invoice) => ({
        "Invoice Number": invoice.invoiceNumber,
        "Invoice Date": new Date(invoice.createdAt).toLocaleDateString(),
        Status: invoice.status,
        Subtotal: invoice.subtotal.toFixed(2),
        Tax: invoice.tax ? invoice.tax.toFixed(2) : "0.00",
        Discount: invoice.discount ? invoice.discount.toFixed(2) : "0.00",
        Total: invoice.total.toFixed(2),
        "Amount Paid": invoice.amountPaid.toFixed(2),
        "Amount Due": invoice.amountDue.toFixed(2),
        "Due Date": new Date(invoice.dueDate).toLocaleDateString(),
      }));

      await exportToExcel({
        sheetName: "Invoices",
        fileName: "stockly-invoices",
        columns: [
          { header: "Invoice Number", key: "Invoice Number", width: 20 },
          { header: "Invoice Date", key: "Invoice Date", width: 12 },
          { header: "Status", key: "Status", width: 12 },
          { header: "Subtotal", key: "Subtotal", width: 12 },
          { header: "Tax", key: "Tax", width: 10 },
          { header: "Discount", key: "Discount", width: 12 },
          { header: "Total", key: "Total", width: 12 },
          { header: "Amount Paid", key: "Amount Paid", width: 12 },
          { header: "Amount Due", key: "Amount Due", width: 12 },
          { header: "Due Date", key: "Due Date", width: 12 },
        ],
        data: excelData,
      });

      toast({
        title: "Excel Export Successful!",
        description: `${filteredInvoices.length} invoices exported to Excel file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export invoices to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredInvoices, toast]);

  return (
    <div className="flex flex-col gap-2">
      {/* Single Row: Search (Left) | Filters (Middle) | Export (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Bar - Left */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
          <Input
            placeholder="Search by Invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <IoClose className="h-4 w-4 text-gray-700 dark:text-white/60" />
            </Button>
          )}
        </div>

        {/* Filters - Middle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {showInvoiceSourceFilter && setInvoiceSourceFilter && (
            <InvoiceSourceDropDown
              value={invoiceSourceFilter}
              onChange={setInvoiceSourceFilter}
            />
          )}
          <InvoiceStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
        </div>

        {/* Export Dropdown - Right */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={filteredInvoices.length === 0}
                className="h-10 w-full sm:w-auto flex items-center gap-2 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 dark:from-violet-500/25 dark:via-violet-500/15 dark:to-violet-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(139,92,246,0.2)] backdrop-blur-sm transition duration-200 hover:border-violet-300/40 hover:from-violet-500/35 hover:via-violet-500/25 hover:to-violet-500/15 dark:hover:border-violet-300/40 dark:hover:from-violet-500/35 dark:hover:via-violet-500/25 dark:hover:to-violet-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export Invoices
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-[28px] border border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm"
            >
              <DropdownMenuItem
                onClick={handleExportToCSV}
                className="cursor-pointer text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
              >
                <FiFileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportToExcel}
                className="cursor-pointer text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
              >
                <FiGrid className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
