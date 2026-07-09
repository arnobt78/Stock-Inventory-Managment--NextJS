/**
 * History (Import History) Table Columns
 * Column definitions for the import history table
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import {
  ImportStatusBadge,
  ImportTypeBadge,
  formatSemanticLabel,
} from "@/lib/ui/semantic-badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Eye } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ImportHistoryForPage } from "@/types";

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
            "flex items-center select-none cursor-pointer gap-1 py-2 text-sm font-normal text-gray-700 dark:text-white",
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
        return <ImportTypeBadge status={v} label={formatSemanticLabel(v)} />;
      },
    },
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <SortableHeader column={column} label="File Name" />
      ),
      cell: ({ getValue }) => (
        <span
          className="font-mono truncate max-w-[180px] block"
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
        <span>
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
          <ImportStatusBadge status={status} />
        );
      },
    },
    {
      accessorKey: "totalRows",
      header: ({ column }) => (
        <SortableHeader column={column} label="Total Rows" />
      ),
      cell: ({ getValue }) => (
        <span>{getValue<number>()}</span>
      ),
    },
    {
      id: "successRows",
      header: "Success",
      cell: ({ row }) => (
        <span className="text-green-600 dark:text-green-400">
          {row.original.successRows}
        </span>
      ),
    },
    {
      id: "failedRows",
      header: "Failed",
      cell: ({ row }) => (
        <span className="text-red-600 dark:text-red-400">
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
