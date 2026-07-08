"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { Column, ColumnDef } from "@tanstack/react-table";
//import { ReactNode } from "react";

import ProductDropDown from "./ProductActions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QRCodeHover } from "@/components/ui/qr-code-hover";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
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
          className={`flex items-center select-none cursor-pointer gap-1 py-2 ${
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
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.original.imageUrl;
        if (!imageUrl) {
          return (
            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No Image
              </span>
            </div>
          );
        }
        return (
          <Image
            src={imageUrl}
            alt={row.original.name}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-lg border border-rose-400/30"
            unoptimized={imageUrl.includes("ik.imagekit.io")} // ImageKit handles optimization
          />
        );
      },
    },

    {
      accessorKey: "name",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Link
            href={detailHref(detailBase, "products", product.id)}
            className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
          >
            {product.name}
          </Link>
        );
      },
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
    },
    {
      accessorKey: "sku",
      header: ({ column }) => <SortableHeader column={column} label="SKU" />,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <SortableHeader column={column} label="Stock" />,
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        const reserved = row.original.reservedQuantity ?? 0;
        const available = quantity - reserved;
        const isLowStock = available > 0 && available < 10;
        const isOutOfStock = available <= 0;

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={isLowStock || isOutOfStock ? "font-semibold" : ""}
              >
                {available}
              </span>
              {isLowStock && (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
              {isOutOfStock && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            {reserved > 0 && (
              <span className="text-xs text-muted-foreground">
                {reserved} reserved
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => <SortableHeader column={column} label="Price" />,
      cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} label="Created At" />
      ),
      cell: ({ getValue }) => {
        const dateValue = getValue<string | Date>();
        const date =
          typeof dateValue === "string" ? new Date(dateValue) : dateValue;

        if (!date || isNaN(date.getTime())) {
          return <span>Unknown Date</span>;
        }

        return (
          <span>
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "expirationDate",
      header: "Expiration Date",
      cell: ({ row }) => {
        const expirationDate = row.original.expirationDate;
        if (!expirationDate) {
          return <span className="text-gray-500 dark:text-gray-400">-</span>;
        }
        const expDate = new Date(expirationDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Color coding: red if expired, orange if expiring within 7 days, green otherwise
        let dateClass = "text-gray-700 dark:text-white";
        if (daysUntilExpiry < 0) {
          dateClass = "text-red-600 dark:text-red-400 font-semibold";
        } else if (daysUntilExpiry <= 7) {
          dateClass = "text-orange-600 dark:text-orange-400 font-semibold";
        }

        return (
          <span className={dateClass}>
            {expDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        let status = "";
        let colorClass = "";

        if (quantity > 20) {
          status = "Available";
          colorClass = "bg-green-100 text-green-600";
        } else if (quantity > 0 && quantity <= 20) {
          status = "Stock Low";
          colorClass = "bg-orange-100 text-orange-600";
        } else {
          status = "Stock Out";
          colorClass = "bg-red-100 text-red-600";
        }

        return (
          <span
            className={`px-3 py-[2px] rounded-full font-medium ${colorClass} flex gap-1 items-center w-fit`}
          >
            {status}
          </span>
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
              className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
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
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
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
                  <Link
                    href={detailHref(
                      detailBase,
                      "suppliers",
                      product.supplierId,
                    )}
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                  >
                    {supplierName}
                  </Link>
                );
              }
              return <span>{supplierName}</span>;
            },
          } as ColumnDef<Product>,
        ]),
    {
      id: "qrCode",
      header: "QR Code",
      cell: ({ row }) => {
        const product = row.original;
        const qrData = JSON.stringify({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: product.quantity,
          status: product.status,
          category: product.category,
          supplier: product.supplier,
        });

        return (
          <QRCodeHover
            data={qrData}
            qrCodeUrl={product.qrCodeUrl}
            title={`${product.name} QR`}
            size={200}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return <ProductDropDown row={row} detailBase={detailBase} />;
      },
    },
  ];
}

export const columns = createProductColumns("");
