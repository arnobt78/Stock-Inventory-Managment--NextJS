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
import {
  DIALOG_TABLE_HEAD_TEXT,
  DIALOG_TABLE_LINK,
  DIALOG_TABLE_TEXT,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared/dialog-edge-scroll";

export type TableColumnContext = "page" | "dialog";

const PAGE_BODY_TEXT = "text-gray-700 dark:text-white";
const PAGE_HEADER_TEXT = "text-gray-700 dark:text-white";

function columnTextClasses(context: TableColumnContext) {
  return context === "dialog"
    ? {
        body: DIALOG_TABLE_TEXT,
        header: DIALOG_TABLE_HEAD_TEXT,
        link: DIALOG_TABLE_LINK,
      }
    : {
        body: PAGE_BODY_TEXT,
        header: PAGE_HEADER_TEXT,
        link: TABLE_CATALOG_LINK_CLASS,
      };
}

type SortableHeaderProps = {
  column: Column<Category, unknown>;
  label: string;
  textClass: string;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({
  column,
  label,
  textClass,
}) => {
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
          className={`flex items-center select-none cursor-pointer gap-1 py-2 text-sm font-normal ${textClass} ${
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

const DIALOG_HIDDEN_COLUMNS = new Set(["description", "notes"]);

export const createCategoryColumns = (
  onEdit: (category: Category) => void,
  options?: { context?: TableColumnContext },
): ColumnDef<Category>[] => {
  const context = options?.context ?? "page";
  const { body: bodyText, header: headerText, link: linkClass } =
    columnTextClasses(context);

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <Link href={`/categories/${category.id}`} className={linkClass}>
            {category.name}
          </Link>
        );
      },
      header: ({ column }) => (
        <SortableHeader
          column={column}
          label="Category"
          textClass={headerText}
        />
      ),
      size: 15,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column} label="Status" textClass={headerText} />
      ),
      cell: ({ row }) => {
        const status = row.original.status ?? true;
        return <ActiveInactiveBadge active={status} />;
      },
      size: 10,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <SortableHeader
          column={column}
          label="Description"
          textClass={headerText}
        />
      ),
      cell: ({ row }) => {
        const description = row.original.description;
        return (
          <span className={bodyText} title={description || undefined}>
            {truncateText(description, 50)}
          </span>
        );
      },
      size: 20,
    },
    {
      accessorKey: "notes",
      header: ({ column }) => (
        <SortableHeader column={column} label="Notes" textClass={headerText} />
      ),
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <span className={bodyText} title={notes || undefined}>
            {truncateText(notes, 50)}
          </span>
        );
      },
      size: 20,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader
          column={column}
          label="Created At"
          textClass={headerText}
        />
      ),
      cell: ({ getValue }) => {
        const dateValue = getValue<string | Date>();
        const date =
          typeof dateValue === "string" ? new Date(dateValue) : dateValue;

        if (!date || isNaN(date.getTime())) {
          return <span className={bodyText}>Unknown Date</span>;
        }

        return (
          <span className={bodyText}>
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
        <SortableHeader
          column={column}
          label="Updated At"
          textClass={headerText}
        />
      ),
      cell: ({ getValue }) => {
        const dateValue = getValue<string | Date | null | undefined>();

        if (!dateValue) {
          return <span className={bodyText}>-</span>;
        }

        const date =
          typeof dateValue === "string" ? new Date(dateValue) : dateValue;

        if (!date || isNaN(date.getTime())) {
          return <span className={bodyText}>-</span>;
        }

        return (
          <span className={bodyText}>
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
      header: () => <span className={headerText}>Actions</span>,
      cell: ({ row }) => {
        return (
          <CategoryActions row={row} onEdit={onEdit} context={context} />
        );
      },
      size: 10,
    },
  ];

  if (context === "dialog") {
    return columns.filter((col) => {
      const key =
        "accessorKey" in col && col.accessorKey
          ? String(col.accessorKey)
          : col.id;
      return !key || !DIALOG_HIDDEN_COLUMNS.has(key);
    });
  }

  return columns;
};
