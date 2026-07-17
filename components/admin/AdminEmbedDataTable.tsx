"use client";

/**
 * REQ-0117 — admin portal embed tables matching UserManagementTable styling.
 */

import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { cn } from "@/lib/utils";

export type AdminEmbedColumn<T> = {
  id: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
};

export type AdminEmbedDataTableProps<T> = {
  columns: AdminEmbedColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage: string;
  emptyIcon?: LucideIcon;
  loadingRows?: number;
  getRowKey: (row: T) => string;
  className?: string;
};

export function AdminEmbedDataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  emptyIcon: EmptyIcon,
  loadingRows = 5,
  getRowKey,
  className,
}: AdminEmbedDataTableProps<T>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-violet-400/20 dark:border-white/10",
        "shadow-[0_30px_80px_rgba(139,92,246,0.25)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.15)]",
        "bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5",
        "backdrop-blur-md overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/40 dark:bg-white/10 hover:bg-transparent border-gray-300/30 dark:border-white/10">
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "text-gray-700 dark:text-gray-300",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBodyPulseRows
              rows={loadingRows}
              columnCount={columns.length}
            />
          ) : (
            <TableBody>
              {data.length === 0 ? (
                <TableRow className="border-gray-300/30 dark:border-white/10 hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="py-10 text-center text-gray-600 dark:text-gray-300"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {EmptyIcon ? (
                        <EmptyIcon className="h-8 w-8 opacity-50" aria-hidden />
                      ) : null}
                      <span>{emptyMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={getRowKey(row)}
                    className={cn(
                      "border-gray-300/30 dark:border-white/10",
                      index % 2 === 0
                        ? "bg-white/30 dark:bg-white/5"
                        : "bg-white/20 dark:bg-white/10",
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id} className={col.cellClassName}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
