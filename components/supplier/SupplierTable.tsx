"use client";

import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Supplier } from "@/types";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import PaginationSelector, {
  type PaginationType,
} from "@/components/shared/PaginationSelector";
import { useClampPaginationIndex } from "@/hooks/use-clamp-pagination-index";
import { Button } from "@/components/ui/button";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";

/**
 * Props for SupplierTable component
 */
interface SupplierTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  userId: string;
  isLoading: boolean;
  searchTerm: string;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
  statusFilter: "all" | "active" | "inactive";
}

/**
 * SupplierTable Component
 * Displays suppliers in a table with sorting, pagination, and filtering
 */
export const SupplierTable = React.memo(function SupplierTable({
  data,
  columns,
  userId,
  isLoading,
  searchTerm,
  pagination,
  setPagination,
  statusFilter,
}: SupplierTableProps<Supplier, unknown>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  /**
   * Filter suppliers based on search term and status filter
   * Memoized to prevent unnecessary recalculations
   */
  const filteredData = useMemo(() => {
    const filtered = data.filter((supplier) => {
      // Search term filtering
      const searchMatch =
        !searchTerm ||
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter: all, active, or inactive
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && supplier.status === true) ||
        (statusFilter === "inactive" && supplier.status === false);

      return searchMatch && statusMatch;
    });

    return filtered;
  }, [data, searchTerm, statusFilter]);

  useClampPaginationIndex(filteredData.length, pagination, setPagination);

  /**
   * Initialize TanStack Table
   */
  const table = useReactTable({
    data: filteredData || [],
    columns,
    state: {
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="poppins mt-0">
      <div className="rounded-[28px] border border-emerald-400/20 dark:border-white/10 shadow-[0_30px_80px_rgba(16,185,129,0.25)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.15)] bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-white/40 dark:bg-white/10"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {isLoading ? (
            <TableBodyPulseRows
              rows={pagination.pageSize}
              columnCount={columns.length}
            />
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      index % 2 === 0
                        ? "bg-white/30 dark:bg-white/5"
                        : "bg-white/20 dark:bg-white/10"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-gray-700 dark:text-white"
                  >
                    No suppliers added/found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Pagination Footer: Rows per page (left) | Page controls (right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
        <PaginationSelector
          pagination={pagination}
          setPagination={setPagination}
          variant="emerald"
          layout="inline"
          enabled={!isLoading}
        />

        {/* Pagination Buttons - Right */}
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BiFirstPage />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GrFormPrevious />
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GrFormNext />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BiLastPage />
          </Button>
        </div>
      </div>
    </div>
  );
});
