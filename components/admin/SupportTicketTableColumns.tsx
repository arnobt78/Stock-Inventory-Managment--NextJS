/**
 * Support Ticket Table Columns
 * REQ-0185 — densify Customer/Sent to; Actions MoreVertical; priority opaque on table.
 * REQ-0189 — Subject & Description header; sky subject link; dual truncate; muted date labels.
 * REQ-0192 — Messages column via ticketMessageTotal (description + replies).
 * REQ-0195 — non-admin Customer/Sent to sky text-xs via resolveDetailAuditUserHref.
 */

"use client";

import React from "react";
import Link from "next/link";
import { Column, ColumnDef } from "@tanstack/react-table";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from "@/lib/ui/semantic-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { cn } from "@/lib/utils";
import {
  ClientDateTime,
  PersonNameEmailCell,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import SupportTicketActions from "@/components/admin/SupportTicketActions";
import { ticketMessageTotal } from "@/lib/support-tickets/ticket-message-stats";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";
import type { ProductOwnerOption, SupportTicket } from "@/types";

type SortableHeaderProps = {
  column: Column<SupportTicket, unknown>;
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

export type CreateSupportTicketColumnsOptions = {
  detailHrefBase?: string;
  productOwners?: ProductOwnerOption[];
  /** Admin store → violet dialog; personal activity → sky */
  dialogVariant?: "sky" | "violet";
  /** When true, person names link to /admin/user-management/{id} */
  linkUserManagement?: boolean;
};

export function createSupportTicketColumns(
  detailHrefBaseOrOptions?: string | CreateSupportTicketColumnsOptions,
): ColumnDef<SupportTicket>[] {
  const opts: CreateSupportTicketColumnsOptions =
    typeof detailHrefBaseOrOptions === "string" ||
    detailHrefBaseOrOptions === undefined
      ? {
          detailHrefBase:
            typeof detailHrefBaseOrOptions === "string"
              ? detailHrefBaseOrOptions
              : "/admin/support-tickets",
        }
      : detailHrefBaseOrOptions;

  const detailHrefBase = opts.detailHrefBase ?? "/admin/support-tickets";
  const productOwners = opts.productOwners ?? [];
  const dialogVariant =
    opts.dialogVariant ??
    (detailHrefBase.startsWith("/admin") ? "violet" : "sky");
  const linkUserManagement =
    opts.linkUserManagement ?? detailHrefBase.startsWith("/admin");

  return [
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <SortableHeader column={column} label="Subject & Description" />
      ),
      cell: ({ row }) => {
        const t = row.original;
        const subject = t.subject ?? "";
        const description = t.description ?? "";
        const detailHref = `${detailHrefBase}/${t.id}`;
        return (
          <div className="flex flex-col min-w-0 max-w-[280px] gap-0.5">
            <Link
              href={detailHref}
              className={cn(TABLE_CATALOG_LINK_CLASS, "truncate")}
              title={subject}
            >
              {subject}
            </Link>
            {description ? (
              <span
                className="truncate text-xs text-muted-foreground"
                title={description}
              >
                {description}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const t = row.original;
        const name =
          t.creatorName?.trim() ||
          t.creatorEmail ||
          t.userId?.slice(-8) ||
          "—";
        // REQ-0195 — admin user-mgmt; non-admin owner-products (sky text-xs via href)
        const href = resolveDetailAuditUserHref(t.userId, linkUserManagement);
        return (
          <PersonNameEmailCell
            seed={t.userId}
            name={name}
            email={t.creatorEmail}
            image={t.creatorImage}
            href={href}
          />
        );
      },
    },
    {
      id: "sentTo",
      header: "Sent to",
      cell: ({ row }) => {
        const t = row.original;
        if (!t.assignedToId) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        const name =
          t.assignedToName?.trim() ||
          t.assignedToEmail ||
          t.assignedToId.slice(-8);
        const href = resolveDetailAuditUserHref(
          t.assignedToId,
          linkUserManagement,
        );
        return (
          <PersonNameEmailCell
            seed={t.assignedToId}
            name={name}
            email={t.assignedToEmail}
            image={t.assignedToImage}
            href={href}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => (
        <TicketStatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <SortableHeader column={column} label="Priority" />
      ),
      cell: ({ row }) => (
        <TicketPriorityBadge
          status={row.original.priority}
          contrast="opaque"
        />
      ),
    },
    {
      id: "messages",
      header: "Messages",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {ticketMessageTotal(row.original.replyCount)}
        </span>
      ),
    },
    {
      id: "date",
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Date" />,
      cell: ({ row }) => {
        const t = row.original;
        // REQ-0189 — muted labels like product Created/Expire
        return (
          <div className="flex flex-col whitespace-nowrap text-xs">
            <span>
              <span className="text-muted-foreground">Created: </span>
              {t.createdAt ? (
                <ClientDateTime date={t.createdAt} semantic="created" />
              ) : (
                "—"
              )}
            </span>
            <span className="mt-0.5">
              <span className="text-muted-foreground">Updated: </span>
              {t.updatedAt ? (
                <ClientDateTime date={t.updatedAt} semantic="updated" />
              ) : (
                "—"
              )}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <SupportTicketActions
          ticket={row.original}
          detailHrefBase={detailHrefBase}
          productOwners={productOwners}
          dialogVariant={dialogVariant}
        />
      ),
    },
  ];
}
