"use client";

import Link from "next/link";
import { Category } from "@/types";
import { Column, ColumnDef } from "@tanstack/react-table";
import CategoryActions from "./CategoryActions";
import { ActiveInactiveBadge } from "@/lib/ui/semantic-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";

type SortableHeaderProps = {
  column: Column<Category, unknown>;
  label: string;
};

/**
 * Sortable Header Component
 * Provides sorting functionality for table columns
 */
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
        {/* Ascending Sorting */}
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <IoMdArrowUp className="mr-2 h-4 w-4" />
          Asc
        </DropdownMenuItem>
        {/* Descending Sorting */}
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <IoMdArrowDown className="mr-2 h-4 w-4" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Truncate text helper function
 * Truncates text to specified length with ellipsis
 */
const truncateText = (
  text: string | null | undefined,
  maxLength: number = 50,
): string => {
  if (!text || text.trim() === "") return "-";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Category Table Columns Definition
 * Defines the columns for the category table with sorting and actions
 */
export const createCategoryColumns = (
  onEdit: (category: Category) => void,
): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <Link
          href={`/categories/${category.id}`}
          className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
        >
          {category.name}
        </Link>
      );
    },
    header: ({ column }) => <SortableHeader column={column} label="Category" />,
    size: 15,
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
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column} label="Description" />
    ),
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <span
          className="text-gray-700 dark:text-white"
          title={description || undefined}
        >
          {truncateText(description, 50)}
        </span>
      );
    },
    size: 20,
  },
  {
    accessorKey: "notes",
    header: ({ column }) => <SortableHeader column={column} label="Notes" />,
    cell: ({ row }) => {
      const notes = row.original.notes;
      return (
        <span
          className="text-gray-700 dark:text-white"
          title={notes || undefined}
        >
          {truncateText(notes, 50)}
        </span>
      );
    },
    size: 20,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created At" />
    ),
    cell: ({ getValue }) => {
      const dateValue = getValue<string | Date>();
      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;

      if (!date || isNaN(date.getTime())) {
        return (
          <span className="text-gray-700 dark:text-white">Unknown Date</span>
        );
      }

      return (
        <span className="text-gray-700 dark:text-white">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
    size: 15,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Updated At" />
    ),
    cell: ({ getValue }) => {
      const dateValue = getValue<string | Date | null | undefined>();

      if (!dateValue) {
        return <span className="text-gray-700 dark:text-white">-</span>;
      }

      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;

      if (!date || isNaN(date.getTime())) {
        return <span className="text-gray-700 dark:text-white">-</span>;
      }

      return (
        <span className="text-gray-700 dark:text-white">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
    size: 15,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <CategoryActions row={row} onEdit={onEdit} />;
    },
    size: 10,
  },
];
