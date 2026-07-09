/**
 * Product Review Table Component
 * Displays product reviews with sorting, pagination, and filtering
 */

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
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import PaginationSelector, {
  type PaginationType,
} from "@/components/shared/PaginationSelector";
import { useClampPaginationIndex } from "@/hooks/use-clamp-pagination-index";
import { Button } from "@/components/ui/button";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";
import type { ProductReview } from "@/types";

interface ProductReviewTableProps {
  data: ProductReview[];
  columns: ColumnDef<ProductReview>[];
  isLoading: boolean;
  searchTerm: string;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
  selectedStatuses: string[];
  selectedRatings: string[];
}

export const ProductReviewTable = React.memo(function ProductReviewTable({
  data,
  columns,
  isLoading,
  searchTerm,
  pagination,
  setPagination,
  selectedStatuses,
  selectedRatings,
}: ProductReviewTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredData = useMemo(() => {
    return data.filter((r) => {
      const searchMatch =
        !searchTerm ||
        r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.productSku ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch =
        selectedStatuses.length === 0 || selectedStatuses.includes(r.status);
      const ratingMatch =
        selectedRatings.length === 0 ||
        selectedRatings.includes(String(r.rating));
      return searchMatch && statusMatch && ratingMatch;
    });
  }, [data, searchTerm, selectedStatuses, selectedRatings]);

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
      <div className="rounded-[28px] border border-violet-400/20 dark:border-white/10 shadow-[0_30px_80px_rgba(139,92,246,0.25)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.15)] bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md overflow-hidden">
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
                    No product reviews found.
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
          variant="violet"
          layout="inline"
          enabled={!isLoading}
        />
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BiFirstPage />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GrFormPrevious />
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GrFormNext />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BiLastPage />
          </Button>
        </div>
      </div>
    </div>
  );
});
