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
import { Warehouse } from "@/types";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import PaginationSelector, {
  type PaginationType,
} from "@/components/shared/PaginationSelector";
import { useClampPaginationIndex } from "@/hooks/use-clamp-pagination-index";
import { Button } from "@/components/ui/button";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";

interface WarehouseTableProps {
  data: Warehouse[];
  columns: ColumnDef<Warehouse, unknown>[];
  isLoading: boolean;
  searchTerm: string;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
  statusFilter: "all" | "active" | "inactive";
}

export const WarehouseTable = React.memo(function WarehouseTable({
  data,
  columns,
  isLoading,
  searchTerm,
  pagination,
  setPagination,
  statusFilter,
}: WarehouseTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredData = useMemo(() => {
    return data.filter((warehouse) => {
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
  }, [data, searchTerm, statusFilter]);

  useClampPaginationIndex(filteredData.length, pagination, setPagination);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { pagination, sorting },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="poppins mt-0">
      <div className="rounded-[28px] border border-sky-400/20 dark:border-white/10 shadow-[0_30px_80px_rgba(2,132,199,0.25)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.15)] bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md overflow-hidden">
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
                    No warehouses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
        <PaginationSelector
          pagination={pagination}
          setPagination={setPagination}
          variant="sky"
          layout="inline"
          enabled={!isLoading}
        />
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30"
          >
            <BiFirstPage />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30"
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
            className="h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30"
          >
            <GrFormNext />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30"
          >
            <BiLastPage />
          </Button>
        </div>
      </div>
    </div>
  );
});
