/**
 * Invoice Table Columns
 * Column definitions for the invoices table using TanStack Table
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Invoice } from "@/types";
import { InvoiceStatusBadge, AdminOrderSourceBadge } from "@/lib/ui/semantic-badges";
import { compactInvoiceMeta } from "@/lib/invoices/compact-invoice-meta";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
} from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Link from "next/link";
import { CopyableText, ClientDate } from "@/components/shared";
import InvoiceActions from "./InvoiceActions";
import { dueDateSemanticKind, semanticDateClass } from "@/lib/ui/semantic-date-styles";
import { cn } from "@/lib/utils";

/**
 * Sortable Header Props
 */
type SortableHeaderProps = {
  column: Column<Invoice, unknown>;
  label: string;
};

/**
 * Sortable Header Component
 * Provides sorting functionality for table columns with dropdown menu
 * Matches Order/Product/Category/Supplier table pattern
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

/** Invoice with optional admin-combined source and display name */
export type InvoiceWithSource = Invoice & {
  _source?: "personal" | "client";
  _displayName?: string;
};

type CreateInvoiceColumnsOptions = {
  /** When true, show (displayName) and Self/Client badge under Invoice # */
  showSourceBadge?: boolean;
  /** When true, show issuedByName / issuedByEmail under Invoice # (e.g. client view) */
  showIssuedBy?: boolean;
};

/**
 * Invoice Table Columns Definition
 * Defines the columns for the invoice table with sorting and actions
 * Matches Order/Product/Category/Supplier table pattern
 */
export const createInvoiceColumns = (
  onEdit: (invoice: Invoice) => void,
  /** When set (e.g. "/admin/invoices"), Invoice # links use {detailHrefBase}/{id} */
  detailHrefBase?: string,
  options?: CreateInvoiceColumnsOptions,
): ColumnDef<Invoice>[] => {
  const invoiceHref = (id: string) =>
    detailHrefBase ? `${detailHrefBase}/${id}` : `/invoices/${id}`;
  return [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <SortableHeader column={column} label="Invoice #" />
      ),
      cell: ({ row }) => {
        const invoice = row.original as InvoiceWithSource;
        const showBadge = options?.showSourceBadge && invoice._source != null;
        const showIssuedBy =
          options?.showIssuedBy &&
          (invoice.issuedByName || invoice.issuedByEmail);
        return (
          <div className="flex flex-col gap-0.5">
            <span className={cn("text-xs", semanticDateClass("created"))}>
              Created <ClientDate date={invoice.createdAt} semantic="created" />
            </span>
            {/* CopyableText: click icon copies invoice # without triggering the row link */}
            <CopyableText value={invoice.invoiceNumber}>
              <Link
                href={invoiceHref(invoice.id)}
                prefetch
                className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
              >
                {invoice.invoiceNumber}
              </Link>
            </CopyableText>
            {showBadge && (
              <div className="flex items-center gap-1 flex-wrap">
                {invoice._displayName != null &&
                  invoice._displayName !== "" && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice._displayName}
                    </span>
                  )}
                <AdminOrderSourceBadge source={invoice._source} />
              </div>
            )}
            {showIssuedBy && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {invoice.issuedByName}
                {invoice.issuedByEmail ? ` (${invoice.issuedByEmail})` : ""}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {compactInvoiceMeta(invoice)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <SortableHeader column={column} label="Due Date" />
      ),
      cell: ({ getValue, row }) => {
        const date = getValue<Date>();
        const dueDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue =
          dueDate < today || row.original.status === "overdue";

        return (
          <ClientDate
            date={date}
            semantic={dueDateSemanticKind(isOverdue)}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return <InvoiceStatusBadge status={status} />;
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => <SortableHeader column={column} label="Total" />,
      cell: ({ getValue }) => {
        const total = getValue<number>();
        return <span>${total.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: "amountDue",
      header: ({ column }) => (
        <SortableHeader column={column} label="Amount Due" />
      ),
      cell: ({ getValue }) => {
        const amountDue = getValue<number>();
        return (
          <span
            className={`font-normal ${amountDue > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
          >
            ${amountDue.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <InvoiceActions
            invoice={row.original}
            onEdit={onEdit}
            detailHrefBase={detailHrefBase}
          />
        );
      },
    },
  ];
};
