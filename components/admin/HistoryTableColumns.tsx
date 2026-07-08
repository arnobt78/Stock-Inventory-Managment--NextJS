/**
 * History (Import History) Table Columns
 * Column definitions for the import history table
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ImportHistoryForPage } from "@/types";

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "processing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-3 w-3" />;
    case "failed":
      return <XCircle className="h-3 w-3" />;
    case "processing":
      return <Loader2 className="h-3 w-3 animate-spin" />;
    default:
      return null;
  }
}

type SortableHeaderProps = {
  column: Column<ImportHistoryForPage, unknown>;
  label: string;
};

function SortableHeader({ column, label }: SortableHeaderProps) {
  const isSorted = column.getIsSorted();
  const SortingIcon =
    isSorted === "asc"
      ? IoMdArrowUp
      : isSorted === "desc"
        ? IoMdArrowDown
        : ArrowUpDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="" asChild>
        <div
          className={cn(
            "flex items-center select-none cursor-pointer gap-1 py-2 text-gray-700 dark:text-white",
            isSorted && "text-primary",
          )}
          aria-label={`Sort by ${label}`}
        >
          {label}
          <SortingIcon className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <IoMdArrowUp className="mr-2 h-4 w-4" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <IoMdArrowDown className="mr-2 h-4 w-4" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createHistoryColumns(
  detailHrefBase?: string,
): ColumnDef<ImportHistoryForPage>[] {
  return [
    {
      accessorKey: "importType",
      header: ({ column }) => (
        <SortableHeader column={column} label="Import Type" />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return <span className="capitalize font-medium">{v}</span>;
      },
    },
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <SortableHeader column={column} label="File Name" />
      ),
      cell: ({ getValue }) => (
        <span
          className="font-mono text-sm truncate max-w-[180px] block"
          title={getValue<string>()}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Date" />,
      cell: ({ getValue }) => (
        <span className="text-sm">
          {format(new Date(getValue<string>()), "MMM dd, yyyy HH:mm")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={getStatusColor(status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(status)}
              {status}
            </span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalRows",
      header: ({ column }) => (
        <SortableHeader column={column} label="Total Rows" />
      ),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<number>()}</span>
      ),
    },
    {
      id: "successRows",
      header: "Success",
      cell: ({ row }) => (
        <span className="text-green-600 dark:text-green-400 font-medium">
          {row.original.successRows}
        </span>
      ),
    },
    {
      id: "failedRows",
      header: "Failed",
      cell: ({ row }) => (
        <span className="text-red-600 dark:text-red-400 font-medium">
          {row.original.failedRows}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original;
        const href = detailHrefBase
          ? `${detailHrefBase}/${record.id}`
          : `/admin/activity-history/${record.id}`;
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href} className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </Link>
          </Button>
        );
      },
    },
  ];
}
