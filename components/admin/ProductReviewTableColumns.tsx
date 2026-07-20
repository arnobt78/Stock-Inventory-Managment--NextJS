/**
 * Product Review Table Columns
 * REQ-0180 — densify Product (thumb+SKU copy) + Reviewer (avatar+email copy)
 * REQ-0182 — Actions → ProductReviewActions MoreVertical menu
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import { ReviewStatusBadge } from "@/lib/ui/semantic-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Star } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AvatarInlineLink,
  ClientDateTime,
  CopyableText,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import ProductReviewActions from "@/components/admin/ProductReviewActions";
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
        const productHref = `/admin/products/${r.productId}`;
        const sku = r.productSku?.trim() || "";
        return (
          <div className="flex items-center gap-3 min-w-0 max-w-[220px]">
            <ProductThumb
              name={r.productName}
              imageUrl={r.productImageUrl}
              size="md"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                href={productHref}
                prefetch
                className={cn("truncate", TABLE_CATALOG_LINK_CLASS)}
                title={r.productName}
              >
                <CopyableText value={r.productName}>
                  {r.productName}
                </CopyableText>
              </Link>
              {sku ? (
                <CopyableText
                  value={sku}
                  className="truncate text-xs text-muted-foreground"
                >
                  {sku}
                </CopyableText>
              ) : null}
            </div>
          </div>
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
        const email = r.reviewerEmail?.trim() || "";
        const href = `/admin/user-management/${r.userId}`;
        return (
          <div className="flex flex-col gap-0.5 min-w-0 max-w-[200px]">
            <AvatarInlineLink
              seed={r.userId}
              image={r.reviewerImage}
              label={name}
              href={href}
              size={24}
              linkClassName={TABLE_CATALOG_LINK_CLASS}
            />
            {email ? (
              <CopyableText
                value={email}
                className="truncate text-xs text-muted-foreground pl-0.5"
              >
                {email}
              </CopyableText>
            ) : null}
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
      cell: ({ row }) => (
        <ProductReviewActions
          review={row.original}
          detailHrefBase={detailHrefBase ?? "/admin/product-reviews"}
        />
      ),
    },
  ];
}
