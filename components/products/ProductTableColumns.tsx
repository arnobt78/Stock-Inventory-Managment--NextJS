"use client";

import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { Product } from "@/types";
import { Column, ColumnDef } from "@tanstack/react-table";
//import { ReactNode } from "react";

import {
  CopyableText,
  AvatarInlineLink,
  TABLE_CATALOG_LINK_CLASS,
  ClientDate,
} from "@/components/shared";
import ProductsDropDown from "@/components/products/ProductActions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QRCodeHover } from "@/components/ui/qr-code-hover";
import {
  ProductStockFromQuantityBadge,
  productStockAvailableTextClass,
} from "@/lib/ui/semantic-badges";
import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";

/** Base path for detail links (e.g. "" or "/admin") so product/category/supplier links stay in admin when on admin page. */
function detailHref(base: string, segment: string, id: string): string {
  const prefix = base ? `${base}/` : "/";
  return `${prefix}${segment}/${id}`;
}

type SortableHeaderProps = {
  column: Column<Product, unknown>;
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

export type CreateProductColumnsOptions = {
  /** When true, show Product Owner column instead of Supplier (for supplier role on /products) */
  forSupplier?: boolean;
};

export function createProductColumns(
  detailBase: string = "",
  options?: CreateProductColumnsOptions,
): ColumnDef<Product>[] {
  const forSupplier = options?.forSupplier === true;
  return [
    {
      id: "product",
      accessorKey: "name",
      // Plain "&" — never HTML entities in string props (SSR/client decode can diverge; REQ-0144)
      header: ({ column }) => (
        <SortableHeader column={column} label="Product & SKU" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const imageUrl = product.imageUrl;
        return (
          <div className="flex items-center gap-3 min-w-0 max-w-[220px]">
            {imageUrl ? (
              <SafeImage
                src={imageUrl}
                alt={product.name}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 object-cover rounded-lg border border-rose-400/30"
                unoptimized={imageUrl.includes("ik.imagekit.io")}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 dark:text-gray-300">
                  No Img
                </span>
              </div>
            )}
            <div className="flex min-w-0 flex-col ">
              <Link
                href={detailHref(detailBase, "products", product.id)}
                prefetch
                className={cn("truncate", TABLE_CATALOG_LINK_CLASS)}
                title={product.name}
              >
                <CopyableText value={product.name}>{product.name}</CopyableText>
              </Link>
              <CopyableText
                value={product.sku}
                className="truncate text-muted-foreground"
              >
                {product.sku}
              </CopyableText>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      // Plain "&" in string props — never `&amp;` (SSR/client decode diverge; REQ-0144)
      header: ({ column }) => (
        <SortableHeader column={column} label="QR & Stock" />
      ),
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        const reserved = getDisplayCommittedQuantity(row.original);
        const available = quantity - reserved;

        return (
          // REQ-0138 — QR box + qty vertically centered (match product thumb size)
          <div className="flex items-center gap-2">
            <QRCodeHover
              data={JSON.stringify({
                id: row.original.id,
                name: row.original.name,
                sku: row.original.sku,
                price: row.original.price,
                quantity: row.original.quantity,
                status: row.original.status,
                category: row.original.category,
                supplier: row.original.supplier,
              })}
              qrCodeUrl={row.original.qrCodeUrl}
              title={row.original.name}
              size={200}
              iconOnly
            />
            <div className="flex flex-col justify-center gap-0.5 min-w-0">
              <span
                className={`text-xs font-medium ${productStockAvailableTextClass(available)}`}
              >
                {available}
              </span>
              {reserved > 0 ? (
                // REQ-0139 — same muted tone as SKU under product name
                <span className="text-xs text-muted-foreground">
                  {reserved} reserved
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        const reserved = getDisplayCommittedQuantity(row.original);
        const available = quantity - reserved;

        return <ProductStockFromQuantityBadge available={available} />;
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => <SortableHeader column={column} label="Price" />,
      cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`,
    },
    {
      // REQ-0139 — sort by createdAt; Created / Expire labels (full words, text-xs)
      accessorKey: "createdAt",
      id: "dates",
      header: ({ column }) => (
        <SortableHeader column={column} label="Created / Expire" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const createdAt = product.createdAt;
        const expirationDate = product.expirationDate;

        let expireClass = "text-muted-foreground";
        if (expirationDate) {
          const expDate = new Date(expirationDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil(
            (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysUntilExpiry < 0) {
            expireClass = "text-red-600 dark:text-red-400";
          } else if (daysUntilExpiry <= 7) {
            expireClass = "text-orange-600 dark:text-orange-400";
          }
        }

        return (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span className="text-xs">
              Created:{" "}
              {createdAt ? (
                <ClientDate
                  date={createdAt}
                  semantic="created"
                  className="text-xs"
                />
              ) : (
                <span>—</span>
              )}
            </span>
            <span className={cn("text-xs", expireClass)}>
              Expire:{" "}
              {expirationDate ? (
                <ClientDate
                  date={expirationDate}
                  semantic="expiration"
                  className="text-xs"
                />
              ) : (
                <span>—</span>
              )}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const product = row.original;
        const categoryName =
          typeof product.category === "object" && product.category
            ? product.category.name
            : (product.category as string | undefined) || "Unknown";
        if (product.categoryId) {
          return (
            <Link
              href={detailHref(detailBase, "categories", product.categoryId)}
              className={TABLE_CATALOG_LINK_CLASS}
            >
              {categoryName}
            </Link>
          );
        }
        return <span>{categoryName}</span>;
      },
    },
    ...(forSupplier
      ? [
          {
            id: "productOwner",
            header: "Product Owner",
            cell: ({ row }) => {
              const product = row.original;
              const name = product.productOwnerName ?? product.userId ?? "—";
              // Link to product detail (supplier sees same products; ownerId filter is for client browse)
              return (
                <Link
                  href={detailHref(detailBase, "products", product.id)}
                  className={TABLE_CATALOG_LINK_CLASS}
                >
                  {name}
                </Link>
              );
            },
          } as ColumnDef<Product>,
        ]
      : [
          {
            accessorKey: "supplier",
            header: "Supplier",
            cell: ({ row }) => {
              const product = row.original;
              const supplierName =
                typeof product.supplier === "object" && product.supplier
                  ? product.supplier.name
                  : (product.supplier as string | undefined) || "Unknown";
              if (product.supplierId) {
                return (
                  <AvatarInlineLink
                    seed={product.supplierId}
                    label={supplierName}
                    href={detailHref(
                      detailBase,
                      "suppliers",
                      product.supplierId,
                    )}
                    size={24}
                    linkClassName={TABLE_CATALOG_LINK_CLASS}
                  />
                );
              }
              return <span>{supplierName}</span>;
            },
          } as ColumnDef<Product>,
        ]),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return <ProductsDropDown row={row} detailBase={detailBase} />;
      },
    },
  ];
}

export const columns = createProductColumns("");
