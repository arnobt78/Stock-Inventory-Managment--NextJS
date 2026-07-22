"use client";

/**
 * REQ-0186 — Type column uses WarehouseTypeBadge; Name/Address use CopyableText;
 * Actions receive detailBase for View Details.
 */

import Link from "next/link";
import type { Warehouse, WarehouseStockSummary } from "@/types";
import { Column, ColumnDef } from "@tanstack/react-table";
import WarehouseActions from "./WarehouseActions";
import {
  ActiveInactiveBadge,
  WarehouseTypeBadge,
} from "@/lib/ui/semantic-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import {
  ClientDate,
  CopyableText,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import { cn } from "@/lib/utils";

type SortableHeaderProps = {
  column: Column<Warehouse, unknown>;
  label: string;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({ column, label }) => {
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
          className={`flex items-center select-none cursor-pointer gap-1 py-2 text-sm font-normal text-gray-700 dark:text-white ${
            isSorted && "text-primary"
          }`}
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
};

const truncateText = (
  text: string | null | undefined,
  maxLength: number = 50,
): string => {
  if (!text || text.trim() === "") return "-";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const createWarehouseColumns = (
  onEdit: (warehouse: Warehouse) => void,
  detailBase: string = "",
  summaryById?: Map<string, WarehouseStockSummary>,
  totalAllocatedQty?: number,
): ColumnDef<Warehouse>[] => [
  {
    accessorKey: "name",
    cell: ({ row }) => {
      const w = row.original;
      const href = detailBase
        ? `${detailBase}/warehouses/${w.id}`
        : `/warehouses/${w.id}`;
      return (
        <Link href={href} className={cn("truncate", TABLE_CATALOG_LINK_CLASS)}>
          <CopyableText value={w.name}>{w.name}</CopyableText>
        </Link>
      );
    },
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    size: 15,
  },
  {
    accessorKey: "address",
    header: ({ column }) => <SortableHeader column={column} label="Address" />,
    cell: ({ row }) => {
      const address = row.original.address?.trim();
      if (!address) {
        return <span className="text-gray-700 dark:text-white">—</span>;
      }
      return (
        <CopyableText value={address} className="max-w-[14rem]">
          <span className="truncate text-gray-700 dark:text-white" title={address}>
            {truncateText(address, 40)}
          </span>
        </CopyableText>
      );
    },
    size: 25,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} label="Type" />,
    cell: ({ row }) => {
      const type = row.original.type?.trim();
      if (!type) {
        return <span className="text-gray-700 dark:text-white">—</span>;
      }
      return <WarehouseTypeBadge type={type} size="compact" />;
    },
    size: 12,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const status = row.original.status ?? true;
      return <ActiveInactiveBadge active={status} />;
    },
    size: 10,
  },
  {
    id: "utilization",
    header: ({ column }) => (
      <SortableHeader column={column} label="Stock share" />
    ),
    cell: ({ row }) => {
      const summary = summaryById?.get(row.original.id);
      const qty = summary?.totalQuantity ?? 0;
      const pct =
        totalAllocatedQty && totalAllocatedQty > 0
          ? Math.round((qty / totalAllocatedQty) * 100)
          : 0;
      return (
        <span
          className="text-gray-700 dark:text-white"
          title={`${qty} units allocated`}
        >
          {qty > 0 ? `${pct}%` : "—"}
        </span>
      );
    },
    size: 10,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Created" />,
    cell: ({ getValue }) => {
      const dateValue = getValue<string | Date>();
      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      if (!date || isNaN(date.getTime()))
        return <span className="text-gray-700 dark:text-white">-</span>;
      return <ClientDate date={date} semantic="created" />;
    },
    size: 15,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <WarehouseActions row={row} onEdit={onEdit} detailBase={detailBase} />
    ),
    size: 10,
  },
];
