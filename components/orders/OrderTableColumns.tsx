/**
 * Order Table Columns
 * Column definitions for the orders table using TanStack Table
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Order } from "@/types";
import {
  AdminOrderSourceBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/lib/ui/semantic-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { format } from "date-fns";
import Link from "next/link";
import { CopyableText } from "@/components/shared";
import OrderActions from "./OrderActions";

const compactOrderMeta = (order: Order) => {
  const items = order.items || [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  return `${items.length} item${items.length === 1 ? "" : "s"} · ${totalQty} unit${totalQty === 1 ? "" : "s"} · ${format(new Date(order.createdAt), "MMM dd, yyyy")}`;
};

/**
 * Sortable Header Props
 */
type SortableHeaderProps = {
  column: Column<Order, unknown>;
  label: string;
};

/**
 * Sortable Header Component
 * Provides sorting functionality for table columns with dropdown menu
 * Matches Product/Category/Supplier table pattern
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

/** Order with optional admin-combined source and display name */
export type OrderWithSource = Order & {
  _source?: "personal" | "client";
  _displayName?: string;
};

type CreateOrderColumnsOptions = {
  /** When true, show (displayName) and Self/Client badge under Order # */
  showSourceBadge?: boolean;
  /** When true, show placedByName / placedByEmail under Order # (e.g. supplier view) */
  showPlacedBy?: boolean;
  /** When true, show productOwnerName / productOwnerEmail under Order # (e.g. client view) */
  showProductOwner?: boolean;
  /** Open InvoiceDialog create mode pre-selected with this order (REQ-0061) */
  onCreateInvoice?: (order: Order) => void;
};

/**
 * Order Table Columns Definition
 * Defines the columns for the order table with sorting and actions
 * Matches Category/Product/Supplier table pattern
 * @param detailHrefBase - When set (e.g. "/admin/orders"), View link uses {detailHrefBase}/{id}
 */
export const createOrderColumns = (
  onEdit: (order: Order) => void,
  detailHrefBase?: string,
  options?: CreateOrderColumnsOptions,
): ColumnDef<Order>[] => [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => <SortableHeader column={column} label="Order #" />,
    cell: ({ row }) => {
      const order = row.original as OrderWithSource;
      const href = detailHrefBase
        ? `${detailHrefBase}/${order.id}`
        : `/orders/${order.id}`;
      const showBadge = options?.showSourceBadge && order._source != null;
      const showPlacedBy =
        options?.showPlacedBy && (order.placedByName || order.placedByEmail);
      const showProductOwner =
        options?.showProductOwner &&
        (order.productOwnerName || order.productOwnerEmail);
      return (
        <div className="flex flex-col gap-0.5">
          {/* CopyableText: click icon copies order # without triggering the row link */}
          <CopyableText value={order.orderNumber}>
            <Link
              href={href}
              prefetch
              className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
            >
              {order.orderNumber}
            </Link>
          </CopyableText>
          {showBadge && (
            <div className="flex items-center gap-1 flex-wrap">
              {order._displayName != null && order._displayName !== "" && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {order._displayName}
                </span>
              )}
              <AdminOrderSourceBadge source={order._source} />
            </div>
          )}
          {showPlacedBy && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {order.placedByName}
              {order.placedByEmail ? ` (${order.placedByEmail})` : ""}
            </span>
          )}
          {showProductOwner && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {order.productOwnerName}
              {order.productOwnerEmail ? ` (${order.productOwnerEmail})` : ""}
            </span>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <OrderStatusBadge status={order.status} size="compact" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {compactOrderMeta(order)}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const status = row.original.status;
      return <OrderStatusBadge status={status} />;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => <SortableHeader column={column} label="Payment" />,
    cell: ({ row }) => {
      const paymentStatus = row.original.paymentStatus;
      return <PaymentStatusBadge status={paymentStatus} />;
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
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items || [];
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      return (
        <span>
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    cell: ({ getValue }) => {
      const date = getValue<Date>();
      return (
        <span>
          {format(new Date(date), "MMM dd, yyyy")}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <OrderActions
          order={row.original}
          onEdit={onEdit}
          detailHrefBase={detailHrefBase}
          onCreateInvoice={options?.onCreateInvoice}
        />
      );
    },
  },
];
