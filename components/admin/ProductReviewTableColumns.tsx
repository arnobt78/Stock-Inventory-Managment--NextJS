/**
 * Product Review Table Columns
 * Column definitions for the product reviews table
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { ReviewStatusBadge } from "@/lib/ui/semantic-badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Eye, Star } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClientDateTime } from "@/components/shared";
import { getRatingDisplay } from "@/lib/ui/review-rating-display";
import type { ProductReview } from "@/types";

type SortableHeaderProps = {
  column: Column<ProductReview, unknown>;
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

export function createProductReviewColumns(
  detailHrefBase?: string,
): ColumnDef<ProductReview>[] {
  return [
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <SortableHeader column={column} label="Product" />
      ),
      cell: ({ row }) => {
        const r = row.original;
        const sku = r.productSku ? ` (${r.productSku})` : "";
        const productHref = `/admin/products/${r.productId}`;
        return (
          <Link
            href={productHref}
            className="font-normal truncate max-w-[180px] block text-primary hover:text-primary/80"
            title={`${r.productName}${sku}`}
          >
            {r.productName}
            {r.productSku ? (
              <span className="text-muted-foreground font-normal text-xs ml-0.5">
                ({r.productSku})
              </span>
            ) : null}
          </Link>
        );
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => <SortableHeader column={column} label="Rating" />,
      cell: ({ row }) => {
        const rating = row.original.rating ?? 0;
        const { label, starClass, textClass } = getRatingDisplay(
          Math.min(5, Math.max(1, Math.round(rating))),
        );
        return (
          <span
            className={cn(
              "inline-flex items-center gap-2 text-xs font-normal capitalize",
              textClass,
            )}
          >
            <Star
              className={cn("h-4 w-4 shrink-0 stroke-[1.5]", starClass)}
              strokeWidth={1.5}
              aria-hidden
            />
            <span>
              {rating}/5
              <span className="ml-1.5 text-xs font-normal opacity-90">
                ({label})
              </span>
            </span>
          </span>
        );
      },
    },
    {
      id: "comment",
      header: "Comment",
      cell: ({ row }) => (
        <span
          className="text-muted-foreground truncate max-w-[200px] block"
          title={row.original.comment}
        >
          {row.original.comment}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const s = row.original.status;
        return <ReviewStatusBadge status={s} />;
      },
    },
    {
      id: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => {
        const r = row.original;
        const name =
          r.reviewerName?.trim() ||
          r.reviewerEmail ||
          r.userId?.slice(-8) ||
          "—";
        const email = r.reviewerEmail ?? "—";
        return (
          <div className="flex flex-col min-w-0 max-w-[180px]">
            <span className=" truncate" title={String(name)}>
              {name}
            </span>
            <span
              className="text-xs text-muted-foreground truncate"
              title={email}
            >
              {email}
            </span>
          </div>
        );
      },
    },
    {
      id: "date",
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Date" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col whitespace-nowrap text-xs">
            <span>
              Created:{" "}
              {r.createdAt ? (
                <ClientDateTime date={r.createdAt} semantic="created" />
              ) : (
                "—"
              )}
            </span>
            <span className="mt-0.5">
              Updated:{" "}
              {r.updatedAt ? (
                <ClientDateTime date={r.updatedAt} semantic="updated" />
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
      cell: ({ row }) => {
        const r = row.original;
        const href = detailHrefBase
          ? `${detailHrefBase}/${r.id}`
          : `/admin/product-reviews/${r.id}`;
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
