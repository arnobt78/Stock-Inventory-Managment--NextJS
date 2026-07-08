/**
 * Support Ticket Table Columns
 * Column definitions for the support tickets table
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
import { ArrowUpDown, Eye } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/types";

function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "closed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "medium":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
    case "low":
      return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

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

export function createSupportTicketColumns(
  detailHrefBase?: string,
): ColumnDef<SupportTicket>[] {
  return [
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <SortableHeader column={column} label="Subject" />
      ),
      cell: ({ row }) => {
        const t = row.original;
        const subject = t.subject ?? "";
        const description = t.description ?? "";
        return (
          <div className="flex flex-col min-w-0 max-w-[280px]">
            <span className="font-medium text-sm truncate" title={subject}>
              {subject}
            </span>
            {description ? (
              <span
                className="text-xs text-muted-foreground line-clamp-2"
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
        const name = t.creatorName ?? t.userId;
        const email = t.creatorEmail ?? "";
        return (
          <div className="flex flex-col min-w-0 max-w-[180px]">
            <span className="font-medium text-sm truncate" title={String(name)}>
              {name}
            </span>
            {email ? (
              <span
                className="text-xs text-muted-foreground truncate"
                title={email}
              >
                {email}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "sentTo",
      header: "Sent to",
      cell: ({ row }) => {
        const t = row.original;
        const name = t.assignedToName ?? t.assignedToId ?? "—";
        const email = t.assignedToEmail ?? "";
        return (
          <div className="flex flex-col min-w-0 max-w-[180px]">
            <span className="font-medium text-sm truncate" title={String(name)}>
              {name}
            </span>
            {email ? (
              <span
                className="text-xs text-muted-foreground truncate"
                title={email}
              >
                {email}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge className={getStatusColor(s)}>{s.replace("_", " ")}</Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <SortableHeader column={column} label="Priority" />
      ),
      cell: ({ row }) => {
        const p = row.original.priority;
        return <Badge className={getPriorityColor(p)}>{p}</Badge>;
      },
    },
    {
      id: "messages",
      header: "Messages",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {1 + (row.original.replyCount ?? 0)}
        </span>
      ),
    },
    {
      id: "date",
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Date" />,
      cell: ({ row }) => {
        const t = row.original;
        const created = t.createdAt
          ? format(new Date(t.createdAt), "MMM d, yyyy 'at' hh:mm a")
          : "—";
        const updated = t.updatedAt
          ? format(new Date(t.updatedAt), "MMM d, yyyy 'at' hh:mm a")
          : "—";
        return (
          <div className="flex flex-col text-sm whitespace-nowrap">
            <span className="text-muted-foreground">Created: {created}</span>
            <span className="text-muted-foreground mt-0.5">
              Updated: {updated}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const t = row.original;
        const href = detailHrefBase
          ? `${detailHrefBase}/${t.id}`
          : `/admin/support-tickets/${t.id}`;
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
