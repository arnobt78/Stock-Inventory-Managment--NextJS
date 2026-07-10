/**
 * Category Detail Page
 * Displays detailed information about a single category
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Calendar,
  Tag,
  BarChart3,
  ShoppingCart,
  User,
  Mail,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useCategory,
  useCreateCategory,
  useDeleteCategory,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  ClientRelativeTime,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
} from "@/components/shared";
import {
  ActiveInactiveBadge,
  OrderStatusBadge,
} from "@/lib/ui/semantic-badges";
import CategoryDialog from "@/components/category/CategoryDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import type { Category } from "@/types";
import { SafeImage } from "@/components/ui/safe-image";
import { isDataSlotLoading } from "@/lib/react-query";
import { cn } from "@/lib/utils";
import { APP_SHELL_DETAIL_CLASS } from "@/lib/ui/shell-layout-styles";

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
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-md transition-all duration-300",
        "bg-white/60 dark:bg-white/5",
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

export type CategoryDetailPageProps = {
  embedInAdmin?: boolean;
  initialCategory?: Category;
};

export default function CategoryDetailPage({
  embedInAdmin,
  initialCategory,
}: CategoryDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { handleBack } = useBackWithRefresh("category");
  const categoryId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  // Fetch category details
  const categoryQuery = useCategory(categoryId, initialCategory);
  const category = categoryQuery.data;
  const dataLoading = isDataSlotLoading(categoryQuery, initialCategory);
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCopying = createCategoryMutation.isPending;
  const isDeleting = deleteCategoryMutation.isPending;
  const isClientRole = user?.role === "client";
  const isSupplierRole = user?.role === "supplier";
  const disableCrud = isClientRole || isSupplierRole;

  // Edit: open category dialog with current category (same as CategoryActions via onEdit)
  const handleEditCategory = () => {
    if (!category) return;
    setEditingCategory(category as Category);
    setEditDialogOpen(true);
  };

  // Duplicate: create a copy (same as CategoryActions, use mutate + callbacks to avoid unhandled rejection)
  const handleDuplicateCategory = () => {
    if (!category || !user?.id) return;
    createCategoryMutation.mutate(
      {
        name: `${category.name} (copy)`,
        userId: user.id,
        status: category.status ?? true,
        description: category.description ?? undefined,
        notes: category.notes ?? undefined,
      },
      {
        onSuccess: () => {
          router.refresh();
        },
      },
    );
  };

  // Delete: confirm then delete (same pattern as SupplierActions / CategoryActions)
  const handleConfirmDeleteCategory = () => {
    if (!category) return;
    deleteCategoryMutation.mutate(category.id, {
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
  if (categoryQuery.isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Category Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {categoryQuery.error instanceof Error
                ? categoryQuery.error.message
                : "Failed to load category details"}
            </p>
            <Button
              onClick={() => router.push("/")}
              className="rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  // Loaded but missing entity (not a query error)
  if (!dataLoading && !category) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Category Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The category you are looking for does not exist or was removed.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  // Format dates — shell visible while loading; pulse individual slots (REQ-0021)
  const createdAt = category?.createdAt
    ? new Date(category.createdAt)
    : new Date();
  const updatedAt = category?.updatedAt ? new Date(category.updatedAt) : null;

  // Category statistics
  const stats = category?.statistics || {
    totalProducts: 0,
    totalQuantitySold: 0,
    totalRevenue: 0,
    uniqueOrders: 0,
    totalValue: 0,
  };

  return (
    <PageWrapper>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <PageSectionHeader
            as="h1"
            tone="amber"
            icon={Tag}
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
              dataLoading ? <DataSlotPulse variant="text-lg" /> : category?.name
            }
            description={
              <ClientRelativeTime date={createdAt} prefix="Created " />
            }
          />

          {/* Category Status Card — same style as supplier detail page */}
          <GlassCard variant="emerald">
            <div className="">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-3">
                Status
              </p>
              {dataLoading ? (
                <DataSlotPulse variant="badge" />
              ) : (
                <ActiveInactiveBadge
                  active={Boolean(category?.status)}
                  className="text-sm"
                />
              )}
            </div>
          </GlassCard>

          {/* Category Information and Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Category Information */}
            <GlassCard variant="orange">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.orange.iconBg,
                    "dark:border-orange-400/30 dark:bg-orange-500/20",
                  )}
                >
                  <Tag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Category Information
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-orange-100/50 via-orange-50/30 to-transparent dark:from-orange-500/10 dark:via-orange-500/5 dark:to-transparent border border-orange-200/30 dark:border-orange-400/10">
                  <Tag className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Name:
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="text-sm" />
                    ) : (
                      category?.name
                    )}
                  </span>
                </div>

                {!dataLoading && category?.description && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border border-amber-200/30 dark:border-amber-400/10">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Description:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white">
                      {category.description}
                    </p>
                  </div>
                )}

                {!dataLoading && category?.notes && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-100/50 via-yellow-50/30 to-transparent dark:from-yellow-500/10 dark:via-yellow-500/5 dark:to-transparent border border-yellow-200/30 dark:border-yellow-400/10">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white">
                      {category.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                  <Calendar className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    <ClientDateTime date={createdAt} />
                  </span>
                </div>

                {updatedAt && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-sky-100/50 via-sky-50/30 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent border border-sky-200/30 dark:border-sky-400/10">
                    <Calendar className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Updated:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientDateTime date={updatedAt} />
                    </span>
                  </div>
                )}

                {/* Creator Information */}
                {!dataLoading && category?.creator && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-violet-100/50 via-violet-50/30 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Created by:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        {category.creator.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Email:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        {category.creator.email}
                      </span>
                    </div>
                  </div>
                )}

                {/* Updater Information */}
                {!dataLoading && category?.updater && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Updated by:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        {category.updater.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Email:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        {category.updater.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Statistics */}
            <GlassCard variant="teal">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.teal.iconBg,
                    "dark:border-teal-400/30 dark:bg-teal-500/20",
                  )}
                >
                  <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    Statistics
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Summary of products and sales data
                  </p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center p-2 rounded-xl bg-gradient-to-r from-sky-100/50 via-sky-50/30 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent border border-sky-200/30 dark:border-sky-400/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Products:
                  </span>
                  <span className="text-sm sm:text-lg font-medium text-sky-600 dark:text-sky-400">
                    {stats.totalProducts}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-gradient-to-r from-violet-100/50 via-violet-50/30 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Quantity Sold:
                  </span>
                  <span className="text-sm sm:text-lg font-medium text-violet-600 dark:text-violet-400">
                    {stats.totalQuantitySold}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Revenue:
                  </span>
                  <span className="text-sm sm:text-lg font-medium text-emerald-600 dark:text-emerald-400">
                    ${stats.totalRevenue.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border border-amber-200/30 dark:border-amber-400/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Orders Containing Products:
                  </span>
                  <span className="text-sm sm:text-lg font-medium text-amber-600 dark:text-amber-400">
                    {stats.uniqueOrders}
                  </span>
                </div>

                <Separator className="my-3 bg-teal-200/50 dark:bg-teal-400/20" />

                <div className="flex justify-between items-center p-2 rounded-xl bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Current Stock Value:
                  </span>
                  <span className="text-sm sm:text-lg font-medium text-blue-600 dark:text-blue-400">
                    ${stats.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Products in this Category */}
          {!dataLoading &&
            category?.products &&
            category.products.length > 0 && (
              <GlassCard variant="sky">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-xl border",
                      variantConfig.sky.iconBg,
                      "dark:border-sky-400/30 dark:bg-sky-500/20",
                    )}
                  >
                    <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Products in this Category
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {category.products.length} product
                      {category.products.length !== 1 ? "s" : ""} in this
                      category
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                  {category.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="flex items-center gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent hover:border-sky-300/60 dark:hover:border-sky-400/40 hover:from-sky-100/60 dark:hover:from-sky-500/20 transition-all duration-300"
                    >
                      {product.imageUrl && (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/50 dark:bg-white/5 border border-sky-200/30 dark:border-sky-400/20 flex-shrink-0">
                          <SafeImage
                            src={product.imageUrl ?? ""}
                            width={64}
                            height={64}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          SKU: {product.sku}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stock: {product.quantity} • $
                          {(product.price ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}

          {/* Recent Orders */}
          {!dataLoading &&
            category?.recentOrders &&
            category.recentOrders.length > 0 && (
              <GlassCard variant="violet">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-xl border",
                      variantConfig.violet.iconBg,
                      "dark:border-violet-400/30 dark:bg-violet-500/20",
                    )}
                  >
                    <ShoppingCart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Recent Orders
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Latest orders containing products in this category
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {category.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.orderId}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-violet-200/40 dark:border-violet-400/20 bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent hover:border-violet-300/60 dark:hover:border-violet-400/40 hover:from-violet-100/60 dark:hover:from-violet-500/20 transition-all duration-300"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-700 dark:text-white">
                          Order {order.orderNumber}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Product: {order.productName} (SKU: {order.productSku})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {order.quantity} × ${order.price.toFixed(2)}{" "}
                          • Date: <ClientDate date={order.orderDate} />
                        </p>
                      </div>
                      <div className="text-left sm:text-right mt-3 sm:mt-0">
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
              </GlassCard>
            )}

          {/* Actions — Back, Edit, Duplicate, Delete; responsive (stack on small, row on larger) */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto gap-2 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleEditCategory}
              disabled={disableCrud}
              className="w-full sm:w-auto gap-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30 text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)] backdrop-blur-md hover:border-blue-300/50 hover:from-blue-500/80 hover:via-blue-500/60 hover:to-blue-500/40 transition-all duration-300 disabled:opacity-50"
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Category
            </Button>
            <Button
              onClick={handleDuplicateCategory}
              disabled={isCopying || disableCrud}
              className="w-full sm:w-auto gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 text-white shadow-[0_10px_25px_rgba(139,92,246,0.35)] backdrop-blur-md hover:border-violet-300/50 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 transition-all duration-300 disabled:opacity-50"
            >
              <Copy className="h-4 w-4 shrink-0" />
              {isCopying ? "Duplicating..." : "Create Duplicate"}
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting || disableCrud}
              className="w-full sm:w-auto gap-2 rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 text-white shadow-[0_10px_25px_rgba(225,29,72,0.35)] backdrop-blur-md hover:border-rose-300/50 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 transition-all duration-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {isDeleting ? "Deleting..." : "Delete Category"}
            </Button>
          </div>

          {/* Delete confirmation — same pattern as CategoryActions */}
          <AlertDialogWrapper
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Are you absolutely sure?"
            description={`This action cannot be undone. This will permanently delete the category "${category?.name ?? ""}".`}
            actionLabel="Delete"
            actionLoadingLabel="Deleting..."
            isLoading={isDeleting}
            onAction={handleConfirmDeleteCategory}
            onCancel={() => setDeleteDialogOpen(false)}
            actionVariant="destructive"
          />

          {/* Edit dialog — opened by "Edit Category"; toasts from mutation hooks */}
          <CategoryDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setEditingCategory(null);
            }}
            editingCategory={editingCategory}
            onEditCategory={(c) => setEditingCategory(c)}
          >
            <div style={{ display: "none" }} aria-hidden />
          </CategoryDialog>
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
