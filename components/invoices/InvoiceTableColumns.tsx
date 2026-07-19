/**
 * REQ-0150 — Invoice table columns densified to match Order table:
 * Invoice # (OrderTableInvoiceCell) · Order # (products + meta) · Status + statusAt · Total · Actions.
 * REQ-0151 — Order # row: OrderStatusBadge + PaymentStatusBadge + event dates inline.
 * REQ-0161 — HelpTooltip on dense column headers (Invoice # / Order # / Status / Total)
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Invoice } from "@/types";
import {
  InvoiceStatusBadge,
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
import { ArrowUpDown, Boxes, Calendar, Package } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Link from "next/link";
import {
  CopyableText,
  ClientDate,
  HelpTooltip,
  SemanticEventDate,
  PaymentMoneyBreakdown,
} from "@/components/shared";
import { OrderTableInvoiceCell } from "@/components/orders/OrderTableInvoiceCell";
import InvoiceActions from "./InvoiceActions";
import {
  getOrderItemUnitCounts,
  getOrderProductPreviewLinks,
} from "@/lib/orders/order-list-meta";
import { invoiceStatusAtSemanticKind } from "@/lib/invoices/invoice-status-display-date";
import { statusAtSemanticKind } from "@/lib/ui/semantic-date-styles";
import { formatStoreOwnerLabel } from "@/lib/orders/order-party";
import {
  INVOICE_NUMBER_COLUMN_TOOLTIP,
  INVOICE_ORDER_COLUMN_TOOLTIP,
  INVOICE_STATUS_COLUMN_TOOLTIP,
  INVOICE_TOTAL_COLUMN_TOOLTIP,
} from "@/lib/ui/order-invoice-column-tooltips";
import { cn } from "@/lib/utils";

const META_MUTED = "text-xs text-gray-500 dark:text-gray-300";

type SortableHeaderProps = {
  column: Column<Invoice, unknown>;
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
 * Invoice Table Columns — shared by admin / user / client / supplier via InvoiceList.
 */
export const createInvoiceColumns = (
  onEdit: (invoice: Invoice) => void,
  /** When set (e.g. "/admin/invoices"), Invoice # links use {detailHrefBase}/{id} */
  detailHrefBase?: string,
  options?: CreateInvoiceColumnsOptions,
): ColumnDef<Invoice>[] => {
  const isAdminBase = detailHrefBase?.startsWith("/admin") === true;
  const invoiceHrefBase = detailHrefBase ?? "/invoices";
  const orderHrefBase = isAdminBase ? "/admin/orders" : "/orders";
  const productHref = (productId: string) =>
    isAdminBase ? `/admin/products/${productId}` : `/products/${productId}`;

  return [
    {
      accessorKey: "invoiceNumber",
      // REQ-0161 — HelpTooltip sibling of sort (catalog Products pattern)
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
      cell: ({ row }) => {
        const invoice = row.original as InvoiceWithSource;
        const showBadge = options?.showSourceBadge && invoice._source != null;
        const showIssuedBy =
          options?.showIssuedBy &&
          (invoice.issuedByName || invoice.issuedByEmail);

        // Normalize dates for OrderTableInvoiceCell (list rows use ISO strings)
        const cellInvoice = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amountDue: invoice.amountDue,
          status: invoice.status,
          createdAt:
            typeof invoice.createdAt === "string"
              ? invoice.createdAt
              : invoice.createdAt?.toISOString?.() ?? undefined,
          dueDate:
            typeof invoice.dueDate === "string"
              ? invoice.dueDate
              : invoice.dueDate?.toISOString?.() ?? undefined,
          paidAt:
            invoice.paidAt == null
              ? null
              : typeof invoice.paidAt === "string"
                ? invoice.paidAt
                : invoice.paidAt.toISOString(),
          sentAt:
            invoice.sentAt == null
              ? null
              : typeof invoice.sentAt === "string"
                ? invoice.sentAt
                : invoice.sentAt.toISOString(),
          cancelledAt:
            invoice.cancelledAt == null
              ? null
              : typeof invoice.cancelledAt === "string"
                ? invoice.cancelledAt
                : invoice.cancelledAt.toISOString(),
          updatedAt:
            invoice.updatedAt == null
              ? null
              : typeof invoice.updatedAt === "string"
                ? invoice.updatedAt
                : invoice.updatedAt.toISOString(),
        };

        return (
          <div className="flex flex-col gap-0.5 min-w-0 max-w-[280px]">
            <OrderTableInvoiceCell
              invoice={cellInvoice}
              invoiceHrefBase={invoiceHrefBase}
            />
            {showBadge && (
              <div className="flex items-center gap-1.5 flex-wrap overflow-visible">
                {invoice._displayName != null &&
                  invoice._displayName !== "" && (
                    <span className={META_MUTED}>{invoice._displayName}</span>
                  )}
                <AdminOrderSourceBadge
                  source={invoice._source}
                  size="compact"
                />
              </div>
            )}
            {showIssuedBy && (
              <span className={META_MUTED}>
                {/* REQ-0159 — Store · issuer so client list does not look like Admin is the customer */}
                {formatStoreOwnerLabel(
                  invoice.issuedByName,
                  invoice.issuedByEmail,
                )}
                {invoice.issuedByEmail
                  ? ` (${invoice.issuedByEmail})`
                  : ""}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "order",
      accessorFn: (row) => row.linkedOrderNumber ?? row.orderId,
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Order #" />
          <HelpTooltip
            content={INVOICE_ORDER_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Order # column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        const orderNumber = invoice.linkedOrderNumber;
        if (!orderNumber) {
          return <span className={META_MUTED}>—</span>;
        }
        const items = invoice.linkedOrderItems ?? [];
        const { links: productLinks, extraCount } =
          getOrderProductPreviewLinks(items);
        const { itemCount, unitCount } = getOrderItemUnitCounts(items);
        const orderCreatedAt = invoice.linkedOrderCreatedAt;

        const orderStatus = invoice.linkedOrderStatus;
        const paymentStatus = invoice.linkedOrderPaymentStatus;
        const orderStatusAt = invoice.linkedOrderStatusAt;
        const orderPaidAt = invoice.linkedOrderPaidAt;
        const ps = (paymentStatus ?? "").toLowerCase();
        const showPaymentEvent =
          (ps === "paid" || ps === "refunded" || ps === "partial") &&
          Boolean(orderPaidAt);
        const paymentKind =
          ps === "refunded"
            ? ("refunded" as const)
            : statusAtSemanticKind(orderStatus, paymentStatus);

        return (
          <div className="flex flex-col gap-0.5 min-w-0 max-w-[320px]">
            {/* REQ-0151 — ORD-# · status · payment (+ dates) */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <CopyableText value={orderNumber}>
                <Link
                  href={`${orderHrefBase}/${invoice.orderId}`}
                  prefetch
                  className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                >
                  {orderNumber}
                </Link>
              </CopyableText>
              {orderStatus ? (
                <OrderStatusBadge status={orderStatus} size="compact" />
              ) : null}
              {paymentStatus ? (
                <PaymentStatusBadge status={paymentStatus} size="compact" />
              ) : null}
            </div>
            {(orderStatusAt || showPaymentEvent) && (
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {orderStatusAt ? (
                  <SemanticEventDate
                    date={orderStatusAt}
                    kind={statusAtSemanticKind(orderStatus, paymentStatus)}
                    mode="datetime"
                  />
                ) : null}
                {showPaymentEvent && orderPaidAt ? (
                  <>
                    {orderStatusAt ? (
                      <span className={META_MUTED} aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <SemanticEventDate
                      date={orderPaidAt}
                      kind={
                        paymentKind === "refunded" || paymentKind === "paid"
                          ? paymentKind
                          : "paid"
                      }
                      mode="datetime"
                    />
                  </>
                ) : null}
              </div>
            )}
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
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-1.5 gap-y-0.5",
                META_MUTED,
              )}
            >
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              <span>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <span aria-hidden>·</span>
              <Boxes className="h-3 w-3 shrink-0" aria-hidden />
              <span>
                {unitCount} unit{unitCount !== 1 ? "s" : ""}
              </span>
              {orderCreatedAt ? (
                <>
                  <span aria-hidden>·</span>
                  <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                  <ClientDate date={orderCreatedAt} semantic="created" />
                </>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <SortableHeader column={column} label="Status" />
          <HelpTooltip
            content={INVOICE_STATUS_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Status column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        const kind = invoiceStatusAtSemanticKind(invoice.status);
        return (
          <div className="flex flex-col items-start gap-1">
            <InvoiceStatusBadge status={invoice.status} size="compact" />
            {invoice.statusAt ? (
              <SemanticEventDate
                date={invoice.statusAt}
                kind={kind}
                mode="datetime"
              />
            ) : null}
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
            content={INVOICE_TOTAL_COLUMN_TOOLTIP}
            side="top"
            ariaLabel="Total column help"
            className="shrink-0"
          />
        </div>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <PaymentMoneyBreakdown
            total={invoice.total}
            amountPaid={invoice.amountPaid}
            amountDue={invoice.amountDue}
            variant="table"
          />
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
