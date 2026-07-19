/**
 * Order Table Columns
 * Column definitions for the orders table using TanStack Table
 * REQ-0145 — Order # meta icons + product preview; Status start-align; Invoice # column
 * REQ-0161 — HelpTooltip on dense column headers (Order # / Total / Status / Payment / Invoice #)
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Order } from "@/types";
import {
  AdminOrderSourceBadge,
  PaymentStatusBadge,
} from "@/lib/ui/semantic-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Boxes, Calendar, Package } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Link from "next/link";
import {
  CopyableText,
  ClientDate,
  HelpTooltip,
  RecentOrderStatusColumn,
  PaymentMoneyBreakdown,
} from "@/components/shared";
import { SemanticEventDate } from "@/components/shared/SemanticEventDate";
import OrderActions from "./OrderActions";
import { OrderTableInvoiceCell } from "./OrderTableInvoiceCell";
import {
  getOrderItemUnitCounts,
  getOrderProductPreviewLinks,
} from "@/lib/orders/order-list-meta";
import { statusAtSemanticKind } from "@/lib/ui/semantic-date-styles";
import { formatStoreOwnerLabel } from "@/lib/orders/order-party";
import {
  INVOICE_NUMBER_COLUMN_TOOLTIP,
  ORDER_NUMBER_COLUMN_TOOLTIP,
  ORDER_PAYMENT_COLUMN_TOOLTIP,
  ORDER_STATUS_COLUMN_TOOLTIP,
  ORDER_TOTAL_COLUMN_TOOLTIP,
} from "@/lib/ui/order-invoice-column-tooltips";
import { cn } from "@/lib/utils";

const META_MUTED = "text-xs text-gray-500 dark:text-gray-300";

/** REQ-0145 — items / units / created with icons; date matches muted meta color */
function OrderCompactMeta({ order }: { order: Order }) {
  const { itemCount, unitCount } = getOrderItemUnitCounts(order.items);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 flex-wrap", META_MUTED)}
    >
      <span className="inline-flex items-center gap-1">
        <Package className="h-3 w-3 shrink-0" aria-hidden />
        {itemCount} item{itemCount === 1 ? "" : "s"}
      </span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Boxes className="h-3 w-3 shrink-0" aria-hidden />
        {unitCount} unit{unitCount === 1 ? "" : "s"}
      </span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3 w-3 shrink-0" aria-hidden />
        <ClientDate date={order.createdAt} className="text-xs" />
      </span>
    </span>
  );
}

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
): ColumnDef<Order>[] => {
  const isAdminBase = detailHrefBase?.startsWith("/admin") === true;
  const invoiceHrefBase = isAdminBase ? "/admin/invoices" : "/invoices";
  const productHref = (productId: string) =>
    isAdminBase ? `/admin/products/${productId}` : `/products/${productId}`;

  return [
    {
      accessorKey: "orderNumber",
      // REQ-0161 — HelpTooltip sibling of sort (catalog Products pattern)
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Order #" />
          <HelpTooltip
            content={ORDER_NUMBER_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Order # column help"
            className="shrink-0"
          />
        </div>
      ),
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
        const { links: productLinks, extraCount } = getOrderProductPreviewLinks(
          order.items,
        );
        return (
          <div className="flex flex-col gap-0.5 min-w-0 max-w-[280px]">
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
              <div className="flex items-center gap-1.5 flex-wrap overflow-visible">
                {order._displayName != null && order._displayName !== "" && (
                  <span className={META_MUTED}>{order._displayName}</span>
                )}
                <AdminOrderSourceBadge source={order._source} size="compact" />
              </div>
            )}
            {showPlacedBy && (
              <span className={META_MUTED}>
                {order.placedByName}
                {order.placedByEmail ? ` (${order.placedByEmail})` : ""}
              </span>
            )}
            {showProductOwner && (
              <span className={META_MUTED}>
                {/* REQ-0159 — Store · owner so client rows do not look like Admin is the customer */}
                {formatStoreOwnerLabel(
                  order.productOwnerName,
                  order.productOwnerEmail,
                )}
                {order.productOwnerEmail
                  ? ` (${order.productOwnerEmail})`
                  : ""}
              </span>
            )}
            {/* REQ-0145 — product row with icon; sky links to product detail */}
            {productLinks.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Package
                  className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-300"
                  aria-hidden
                />
                {productLinks.map((p, i) => (
                  <span
                    key={p.productId}
                    className="inline-flex items-center gap-1 min-w-0"
                  >
                    {i > 0 ? (
                      <span className={META_MUTED} aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <Link
                      href={productHref(p.productId)}
                      prefetch
                      className="truncate text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      title={p.label}
                    >
                      {p.label}
                    </Link>
                  </span>
                ))}
                {extraCount > 0 ? (
                  <span className={META_MUTED}>+{extraCount}</span>
                ) : null}
              </div>
            ) : null}
            <OrderCompactMeta order={order} />
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Total" />
          <HelpTooltip
            content={ORDER_TOTAL_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Total column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => {
        const order = row.original;
        const inv = order.invoiceForOrder;
        const paid = inv?.amountPaid ?? 0;
        // REQ-0152 — compact paid/due under total when any amount has been paid
        if (inv && paid > 0) {
          return (
            <PaymentMoneyBreakdown
              total={order.total}
              amountPaid={paid}
              amountDue={inv.amountDue}
              variant="table"
            />
          );
        }
        return (
          <span className="tabular-nums">${order.total.toFixed(2)}</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Status" />
          <HelpTooltip
            content={ORDER_STATUS_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Status column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => {
        const order = row.original;
        return (
          <RecentOrderStatusColumn
            status={order.status ?? ""}
            statusAt={order.statusAt}
            paymentStatus={order.paymentStatus}
            align="start"
            className="py-0"
          />
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Payment" />
          <HelpTooltip
            content={ORDER_PAYMENT_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Payment column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => {
        const order = row.original;
        const paymentStatus = order.paymentStatus;
        const ps = (paymentStatus ?? "").toLowerCase();
        // paidAt from linked invoice (list enrich) or order.paidAt / statusAt fallback
        const paidAt =
          order.invoiceForOrder?.paidAt ?? order.paidAt ?? order.statusAt;
        const showPaymentEvent =
          (ps === "paid" || ps === "refunded" || ps === "partial") &&
          Boolean(paidAt);
        const eventKind =
          ps === "refunded"
            ? ("refunded" as const)
            : statusAtSemanticKind(order.status, paymentStatus);
        return (
          <div className="flex flex-col items-start gap-1">
            <PaymentStatusBadge status={paymentStatus} size="compact" />
            {showPaymentEvent && paidAt ? (
              <SemanticEventDate
                date={paidAt}
                kind={
                  eventKind === "refunded" || eventKind === "paid"
                    ? eventKind
                    : "paid"
                }
                mode="datetime"
              />
            ) : null}
          </div>
        );
      },
    },
    {
      id: "invoice",
      accessorFn: (row) => row.invoiceForOrder?.invoiceNumber ?? "",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Invoice #" />
          <HelpTooltip
            content={INVOICE_NUMBER_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Invoice # column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => (
        <OrderTableInvoiceCell
          invoice={row.original.invoiceForOrder}
          invoiceHrefBase={invoiceHrefBase}
        />
      ),
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
};
