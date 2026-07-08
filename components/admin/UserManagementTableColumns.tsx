/**
 * User Management Table Columns
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Eye, Pencil, Trash2, MoreVertical } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserForAdmin } from "@/types";

function getRoleColor(role: string | null): string {
  switch (role ?? "") {
    case "admin":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
    case "supplier":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "client":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
    case "retailer":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "user":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

type SortableHeaderProps = {
  column: Column<UserForAdmin, unknown>;
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

const PROTECTED_EMAILS = [
  "test@admin.com",
  "test@supplier.com",
  "test@client.com",
];

/** Derive display username from email when username is empty (e.g. Gmail login) */
function getDisplayUsername(user: UserForAdmin): string {
  if (user.username?.trim()) return user.username.trim();
  const email = user.email ?? "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : "—";
}

export function createUserManagementColumns(
  detailHrefBase?: string,
  currentUserId?: string | null,
): ColumnDef<UserForAdmin>[] {
  const base = detailHrefBase ?? "/admin/user-management";
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
      cell: ({ row }) => {
        const u = row.original;
        const href = `${base}/${u.id}`;
        return (
          <Link
            href={href}
            className="font-medium truncate max-w-[140px] block text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
            title={u.name}
          >
            {u.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} label="Email" />,
      cell: ({ row }) => (
        <span
          className="text-sm truncate max-w-[180px] block"
          title={row.original.email}
        >
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => {
        const display = getDisplayUsername(row.original);
        return (
          <span
            className={cn(
              "text-sm truncate max-w-[100px] block",
              display === "—" && "text-muted-foreground",
            )}
            title={display}
          >
            {display}
          </span>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <SortableHeader column={column} label="Role" />,
      cell: ({ row }) => {
        const r = row.original.role ?? "user";
        return <Badge className={getRoleColor(r)}>{r}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Joined" />,
      cell: ({ getValue }) => (
        <span className="text-sm">
          {format(new Date(getValue<string>()), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const u = row.original;
        const href = `${base}/${u.id}`;
        const isOwner = currentUserId != null && currentUserId === u.id;
        const isProtected = PROTECTED_EMAILS.includes(
          (u.email ?? "").toLowerCase(),
        );
        const canEdit = isOwner && !isProtected;
        const canDelete = false; // Disabled for all in list; only owner on detail page per requirements
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                aria-label="Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={href} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4" />
                  View Detail
                </Link>
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem asChild>
                  <Link href={href} className="gap-2 cursor-pointer">
                    <Pencil className="h-4 w-4" />
                    Edit User
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!canDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
