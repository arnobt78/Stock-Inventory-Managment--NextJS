/**
 * Product Detail Page
 * Displays detailed information about a single product
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Package,
  Calendar,
  Tag,
  Truck,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  QrCode,
  Image as ImageIcon,
  User,
  Mail,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OrderStatusBadge,
  ProductStockStatusBadge,
} from "@/lib/ui/semantic-badges";
import { Separator } from "@/components/ui/separator";
import {
  useProduct,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useAuth } from "@/contexts";
import { useProductStore } from "@/stores";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  ClientRelativeTime,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
} from "@/components/shared";
import { isDataSlotLoading } from "@/lib/react-query";
import type { Product, ProductStatus, ProductReview } from "@/types";
import type { ReviewEligibilityResult } from "@/lib/server/product-reviews-detail-data";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ProductFormDialog from "@/components/products/ProductFormDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";

/**
 * Color variants for glassmorphic cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal";

const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = {
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
    hoverBorder: "hover:border-sky-300/40",
    iconBg: "border-sky-300/30 bg-sky-100/50",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient:
      "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)]",
    hoverBorder: "hover:border-emerald-300/40",
    iconBg: "border-emerald-300/30 bg-emerald-100/50",
  },
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    hoverBorder: "hover:border-amber-300/40",
    iconBg: "border-amber-300/30 bg-amber-100/50",
  },
  rose: {
    border: "border-rose-400/20",
    gradient:
      "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(225,29,72,0.15)] dark:shadow-[0_15px_40px_rgba(225,29,72,0.1)]",
    hoverBorder: "hover:border-rose-300/40",
    iconBg: "border-rose-300/30 bg-rose-100/50",
  },
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
    hoverBorder: "hover:border-violet-300/40",
    iconBg: "border-violet-300/30 bg-violet-100/50",
  },
  blue: {
    border: "border-blue-400/20",
    gradient:
      "bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(59,130,246,0.15)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.1)]",
    hoverBorder: "hover:border-blue-300/40",
    iconBg: "border-blue-300/30 bg-blue-100/50",
  },
  orange: {
    border: "border-orange-400/20",
    gradient:
      "bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(249,115,22,0.15)] dark:shadow-[0_15px_40px_rgba(249,115,22,0.1)]",
    hoverBorder: "hover:border-orange-300/40",
    iconBg: "border-orange-300/30 bg-orange-100/50",
  },
  teal: {
    border: "border-teal-400/20",
    gradient:
      "bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(20,184,166,0.15)] dark:shadow-[0_15px_40px_rgba(20,184,166,0.1)]",
    hoverBorder: "hover:border-teal-300/40",
    iconBg: "border-teal-300/30 bg-teal-100/50",
  },
};

/**
 * Glassmorphic Card component
 */
function GlassCard({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "rounded-[20px] border backdrop-blur-md transition overflow-hidden",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

export type ProductDetailPageProps = {
  embedInAdmin?: boolean;
  initialProduct?: Product;
  /** REQ-0026 — SSR reviews for product detail */
  initialReviews?: ProductReview[];
  initialEligibility?: ReviewEligibilityResult;
};

export default function ProductDetailPage({
  embedInAdmin,
  initialProduct,
  initialReviews,
  initialEligibility,
}: ProductDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { handleBack } = useBackWithRefresh("product");
  const productId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  // Fetch product details
  const productQuery = useProduct(productId, initialProduct);
  const product = productQuery.data;
  const dataLoading = isDataSlotLoading(productQuery, initialProduct);
  const { data: allProducts = [] } = useProducts();
  const { setSelectedProduct, setOpenProductDialog } = useProductStore();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCopying = createProductMutation.isPending;
  const isDeleting = deleteProductMutation.isPending;
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const disableCrud = isSupplierRole || isClientRole;

  // Edit: open product form dialog with current product (same as ProductActions)
  const handleEditProduct = () => {
    if (!product) return;
    const productForForm: Product = {
      ...product,
      category:
        typeof product?.category === "object"
          ? (product?.category as { name?: string })?.name
          : (product as { category?: string }).category,
      supplier:
        typeof product?.supplier === "object"
          ? (product?.supplier as { name?: string })?.name
          : (product as { supplier?: string }).supplier,
    };
    setSelectedProduct(productForForm);
    setOpenProductDialog(true);
  };

  // Duplicate: create a copy (same as ProductActions, use mutate + callbacks to avoid unhandled rejection)
  const handleDuplicateProduct = () => {
    if (!product) return;
    const uniqueSku = `${product?.sku}-${Date.now()}`;
    createProductMutation.mutate(
      {
        name: `${product?.name} (copy)`,
        sku: uniqueSku,
        price: product?.price,
        quantity: product?.quantity,
        status: (product?.status as ProductStatus) || "Available",
        categoryId: product?.categoryId,
        supplierId: product?.supplierId,
        userId: product?.userId,
      },
      {
        onSuccess: () => {
          router.refresh();
        },
      },
    );
  };

  // Delete: confirm then delete (same as ProductActions)
  const handleConfirmDeleteProduct = () => {
    if (!product) return;
    deleteProductMutation.mutate(product?.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/");
      },
      onError: () => {
        setDeleteDialogOpen(false);
      },
    });
  }; // Redirect if not authenticated
  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push("/login");
    }
  }, [user, isCheckingAuth, router]);

  // Show error state
  if (productQuery.isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-white mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {productQuery.error instanceof Error
                ? productQuery.error.message
                : "Failed to load product details"}
            </p>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Format dates — REQ-0021 shell-first
  const createdAt = product?.createdAt
    ? new Date(product?.createdAt)
    : new Date();
  const updatedAt = product?.updatedAt ? new Date(product?.updatedAt) : null;
  const expirationDate = product?.expirationDate
    ? new Date(product?.expirationDate)
    : null;

  // Product statistics
  const stats = product?.statistics || {
    totalQuantitySold: 0,
    totalRevenue: 0,
    uniqueOrders: 0,
    totalValue: 0,
  };

  return (
    <PageWrapper>
      <PageContentWrapper>
        <div className="max-w-9xl mx-auto space-y-4">
          {/* Header */}
          <PageSectionHeader
            as="h1"
            tone="rose"
            icon={Package}
            leading={
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 shrink-0 self-center rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            }
            title={
              dataLoading ? (
                <DataSlotPulse variant="text-lg" className="w-48" />
              ) : (
                product!.name
              )
            }
            description={
              <>
                SKU: {product?.sku} • Created{" "}
                <ClientRelativeTime date={createdAt} />
              </>
            }
          />

          {/* Product Image and QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {/* Product Image */}
            <GlassCard variant="sky">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/30 bg-sky-100/50 dark:border-white/15 dark:bg-white/10">
                    <ImageIcon className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-white">
                    Product Image
                  </h3>
                </div>
                {product?.imageUrl ? (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden bg-white/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10">
                    <Image
                      src={product?.imageUrl}
                      alt={product?.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-xl bg-white/30 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-white/50">
                      No image available
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* QR Code / Barcode */}
            <GlassCard variant="violet">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
                    <QrCode className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-white">
                    QR Code / Barcode
                  </h3>
                </div>
                {product?.qrCodeUrl ? (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden bg-white border border-gray-300/20 dark:border-white/10">
                    <Image
                      src={product?.qrCodeUrl}
                      alt={`QR Code for ${product?.sku}`}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-xl bg-white/30 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-white/50">
                      No QR code available
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Product Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <GlassCard variant="emerald">
              <div className="p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-3">
                  Status
                </p>
                <ProductStockStatusBadge
                  status={product?.status ?? "available"}
                  label={product?.status || "N/A"}
                  size="detail"
                  className="text-sm"
                />
              </div>
            </GlassCard>

            <GlassCard variant="amber">
              <div className="p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-3">
                  Stock
                </p>
                <p className="text-lg sm:text-xl font-medium text-gray-700 dark:text-white">
                  {(product?.quantity ?? 0) - (product?.reservedQuantity ?? 0)}
                  <span className="text-sm font-normal text-gray-600 dark:text-white/60 ml-1">
                    available
                  </span>
                </p>
                {(product?.reservedQuantity ?? 0) > 0 && (
                  <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                    {product?.reservedQuantity} reserved · {product?.quantity}{" "}
                    total
                  </p>
                )}
              </div>
            </GlassCard>

            <GlassCard variant="blue">
              <div className="p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-3">
                  Price
                </p>
                <p className="text-lg sm:text-xl font-medium text-gray-700 dark:text-white">
                  ${product?.price.toFixed(2)}
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Product Information and Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Product Information */}
            <GlassCard variant="teal">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-100/50 dark:border-white/15 dark:bg-white/10">
                    <Package className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-white">
                    Product Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-gray-500 dark:text-white/50" />
                    <span className="text-gray-600 dark:text-white/60">
                      SKU:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      {product?.sku}
                    </span>
                  </div>

                  {product?.category &&
                    typeof product?.category === "object" && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-gray-500 dark:text-white/50" />
                        <span className="text-gray-600 dark:text-white/60">
                          Category:
                        </span>
                        <Link
                          href={
                            embedInAdmin
                              ? `/admin/categories/${product?.category.id}`
                              : `/categories/${product?.category.id}`
                          }
                          className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          {product?.category.name}
                        </Link>
                      </div>
                    )}

                  {product?.supplier &&
                    typeof product?.supplier === "object" && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-gray-500 dark:text-white/50" />
                        <span className="text-gray-600 dark:text-white/60">
                          Supplier:
                        </span>
                        <Link
                          href={
                            embedInAdmin
                              ? `/admin/suppliers/${product?.supplier.id}`
                              : `/suppliers/${product?.supplier.id}`
                          }
                          className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          {product?.supplier.name}
                        </Link>
                      </div>
                    )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-white/50" />
                    <span className="text-gray-600 dark:text-white/60">
                      Created:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientDateTime date={createdAt} />
                    </span>
                  </div>

                  {updatedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-white/50" />
                      <span className="text-gray-600 dark:text-white/60">
                        Updated:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        <ClientDateTime date={updatedAt} />
                      </span>
                    </div>
                  )}

                  {expirationDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-white/50" />
                      <span className="text-gray-600 dark:text-white/60">
                        Expiration Date:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        <ClientDate date={expirationDate} />
                      </span>
                    </div>
                  )}

                  {/* Creator Information */}
                  {product?.creator && (
                    <div className="pt-2 mt-3 border-t border-teal-400/20">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500 dark:text-white/50" />
                        <span className="text-gray-600 dark:text-white/60">
                          Created by:
                        </span>
                        <span className="font-medium text-gray-700 dark:text-white">
                          {product?.creator.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Mail className="h-4 w-4 text-gray-500 dark:text-white/50" />
                        <span className="text-gray-600 dark:text-white/60">
                          Email:
                        </span>
                        <span className="font-medium text-gray-700 dark:text-white">
                          {product?.creator.email}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Updater Information */}
                  {product?.updater && (
                    <div className="pt-2 mt-3 border-t border-teal-400/20">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500 dark:text-white/50" />
                        <span className="text-gray-600 dark:text-white/60">
                          Updated by:
                        </span>
                        <span className="font-medium text-gray-700 dark:text-white">
                          {product?.updater.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Mail className="h-4 w-4 text-gray-500 dark:text-white/50" />
                        <span className="text-gray-600 dark:text-white/60">
                          Email:
                        </span>
                        <span className="font-medium text-gray-700 dark:text-white">
                          {product?.updater.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Sales Statistics */}
            <GlassCard variant="orange">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/30 bg-orange-100/50 dark:border-white/15 dark:bg-white/10">
                    <BarChart3 className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-white">
                      Sales Statistics
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Summary of sales and inventory data
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center p-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Total Quantity Sold:
                    </span>
                    <span className="text-lg font-medium text-gray-700 dark:text-white">
                      {stats.totalQuantitySold}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Total Revenue:
                    </span>
                    <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400">
                      ${stats.totalRevenue.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Orders Containing This Product:
                    </span>
                    <span className="text-lg font-medium text-gray-700 dark:text-white">
                      {stats.uniqueOrders}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Current Stock Value:
                    </span>
                    <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                      ${(stats.totalValue ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recent Orders */}
          {product?.recentOrders && product?.recentOrders.length > 0 && (
            <GlassCard variant="rose">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300/30 bg-rose-100/50 dark:border-white/15 dark:bg-white/10">
                    <ShoppingCart className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-white">
                      Recent Orders
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Latest orders containing this product
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {product?.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={
                        embedInAdmin
                          ? `/admin/orders/${order.orderId}`
                          : `/orders/${order.orderId}`
                      }
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 backdrop-blur-md transition-colors gap-2"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-700 dark:text-white">
                          Order {order.orderNumber}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                          Quantity: {order.quantity} × ${order.price.toFixed(2)}{" "}
                          • Date: <ClientDate date={order.orderDate} />
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        {/* Sale price style: crossed-out subtotal + actual proportional amount */}
                        <p className="font-medium text-gray-700 dark:text-white">
                          {typeof order.proportionalAmount === "number" &&
                          order.proportionalAmount !== order.subtotal ? (
                            <>
                              <span className="text-gray-500 dark:text-white/50 line-through mr-2">
                                ${order.subtotal.toFixed(2)}
                              </span>
                              <span className="text-rose-600 dark:text-rose-400">
                                ${order.proportionalAmount.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            `$${order.subtotal.toFixed(2)}`
                          )}
                        </p>
                        <OrderStatusBadge
                          status={order.orderStatus ?? "pending"}
                          className="mt-1"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Product Reviews */}
          {product?.id ? (
            <ProductReviewsSection
              productId={product.id}
              productName={product.name ?? ""}
              variant="amber"
              initialReviews={initialReviews}
              initialEligibility={initialEligibility}
            />
          ) : dataLoading ? (
            <DataSlotPulse variant="chart" className="min-h-[120px]" />
          ) : null}

          {/* Actions — Back, Edit, Duplicate, Delete; responsive (stack on small, row on larger) */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto gap-2 rounded-xl border-gray-400/30 bg-white/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleEditProduct}
              disabled={disableCrud}
              className="w-full sm:w-auto gap-2 rounded-xl border-blue-400/30 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent hover:from-blue-500/30 shadow-[0_5px_20px_rgba(59,130,246,0.15)]"
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Product
            </Button>
            <Button
              variant="outline"
              onClick={handleDuplicateProduct}
              disabled={isCopying || disableCrud}
              className="w-full sm:w-auto gap-2 rounded-xl border-violet-400/30 bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-transparent hover:from-violet-500/30 shadow-[0_5px_20px_rgba(139,92,246,0.15)]"
            >
              <Copy className="h-4 w-4 shrink-0" />
              {isCopying ? "Duplicating..." : "Create Duplicate"}
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting || disableCrud}
              className="w-full sm:w-auto gap-2 rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent text-white hover:from-rose-500/30 shadow-[0_5px_20px_rgba(225,29,72,0.15)]"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </div>

          {/* Delete confirmation — same pattern as ProductActions */}
          <AlertDialogWrapper
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Product"
            description={`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`}
            actionLabel="Delete"
            actionLoadingLabel="Deleting..."
            isLoading={isDeleting}
            onAction={handleConfirmDeleteProduct}
            onCancel={() => setDeleteDialogOpen(false)}
          />

          {/* Edit dialog — opened by "Edit Product"; toasts from mutation hooks */}
          <ProductFormDialog allProducts={allProducts} userId={user?.id ?? ""}>
            <div style={{ display: "none" }} aria-hidden />
          </ProductFormDialog>
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
