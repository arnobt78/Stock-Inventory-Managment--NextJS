/**
 * Warehouse Detail Page
 * Displays detailed information about a single warehouse
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Tag,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Package,
  Calendar,
  Clock,
  Building2,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useWarehouse,
  useDeleteWarehouse,
  useStockByWarehouse,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDateTime,
  ClientRelativeTime,
  PageContentWrapper,
  DataSlotPulse,
} from "@/components/shared";
import WarehouseDialog from "@/components/warehouses/WarehouseDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import type { Warehouse as WarehouseType } from "@/types";
import { isDataSlotLoading } from "@/lib/react-query";
import { cn } from "@/lib/utils";

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
  | "teal"
  | "cyan";

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
  cyan: {
    border: "border-cyan-400/20",
    gradient:
      "bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(6,182,212,0.15)] dark:shadow-[0_15px_40px_rgba(6,182,212,0.1)]",
    hoverBorder: "hover:border-cyan-300/40",
    iconBg: "border-cyan-300/30 bg-cyan-100/50",
  },
};

/**
 * Glassmorphic Card component
 */
function GlassCard({
  children,
  variant = "teal",
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
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-sm transition-all duration-300",
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

/** Badge classes for Warehouse Status (Active/Inactive) — distinct colors for light and dark mode */
function getWarehouseStatusBadgeClasses(active: boolean): string {
  return active
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300/40"
    : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border border-rose-300/40";
}

/** Badge classes for Warehouse Type — distinct colors per type, light and dark mode */
function getWarehouseTypeBadgeClasses(type: string): string {
  const t = (type || "").toLowerCase();
  switch (t) {
    case "main":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300/40";
    case "secondary":
      return "bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200 border border-slate-300/40";
    case "storage":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300/40";
    case "distribution":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border border-violet-300/40";
    case "retail":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border border-sky-300/40";
    case "other":
      return "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 border border-gray-300/40";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300/40";
  }
}

export type WarehouseDetailPageProps = { embedInAdmin?: boolean };

export default function WarehouseDetailPage({
  embedInAdmin,
}: WarehouseDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { navigateTo } = useBackWithRefresh("warehouse");
  const warehouseId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  const warehousesListHref = embedInAdmin ? "/admin/warehouses" : "/warehouses";

  const warehouseQuery = useWarehouse(warehouseId);
  const warehouse = warehouseQuery.data;
  const dataLoading = isDataSlotLoading(warehouseQuery);
  const { data: stockAllocations, isLoading: isLoadingStock } =
    useStockByWarehouse(warehouseId);
  const deleteWarehouseMutation = useDeleteWarehouse();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isDeleting = deleteWarehouseMutation.isPending;

  const handleEdit = () => {
    if (!warehouse) return;
    setEditingWarehouse(warehouse as WarehouseType);
    setEditDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!warehouse) return;
    deleteWarehouseMutation.mutate(warehouse?.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push(warehousesListHref);
      },
      onError: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push("/login");
    }
  }, [user, isCheckingAuth, router]);

  if (warehouseQuery.isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-2">
              Warehouse Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {warehouseQuery.error instanceof Error
                ? warehouseQuery.error.message
                : "Failed to load warehouse details"}
            </p>
            <Button
              onClick={() => navigateTo(warehousesListHref)}
              className="rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warehouses
            </Button>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  const createdAt =
    warehouse?.createdAt
      ? typeof warehouse?.createdAt === "string"
        ? new Date(warehouse?.createdAt)
        : warehouse?.createdAt
      : new Date();
  const updatedAt = warehouse?.updatedAt
    ? typeof warehouse?.updatedAt === "string"
      ? new Date(warehouse?.updatedAt)
      : warehouse?.updatedAt
    : null;

  // Calculate stock summary
  const stockSummary = stockAllocations
    ? {
        totalProducts: stockAllocations.length,
        totalQuantity: stockAllocations.reduce((sum, a) => sum + a.quantity, 0),
        availableQuantity: stockAllocations.reduce(
          (sum, a) => sum + (a.quantity - a.reservedQuantity),
          0,
        ),
        reservedQuantity: stockAllocations.reduce(
          (sum, a) => sum + a.reservedQuantity,
          0,
        ),
      }
    : null;

  return (
    <PageWrapper>
      <PageContentWrapper>
        <div className="max-w-9xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTo(warehousesListHref)}
              aria-label="Back to Warehouses"
              className="h-10 w-10 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                {warehouse?.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <ClientRelativeTime date={createdAt} prefix="Created " />
              </p>
            </div>
          </div>

          {/* Status Card */}
          <GlassCard variant={warehouse?.status ? "emerald" : "rose"}>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
              Warehouse Status
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-sm px-3 py-1.5 rounded-full flex items-center gap-2 w-fit font-medium",
                getWarehouseStatusBadgeClasses(Boolean(warehouse?.status)),
              )}
            >
              {warehouse?.status ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Inactive
                </>
              )}
            </Badge>
          </GlassCard>

          {/* Stock Summary Statistics */}
          {stockSummary && stockSummary.totalProducts > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <GlassCard variant="sky" className="text-center">
                <div
                  className={cn(
                    "p-2 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.sky.iconBg,
                    "dark:border-sky-400/30 dark:bg-sky-500/20",
                  )}
                >
                  <Boxes className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                  {stockSummary.totalProducts}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Products
                </p>
              </GlassCard>
              <GlassCard variant="violet" className="text-center">
                <div
                  className={cn(
                    "p-2 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.violet.iconBg,
                    "dark:border-violet-400/30 dark:bg-violet-500/20",
                  )}
                >
                  <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                  {stockSummary.totalQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Stock
                </p>
              </GlassCard>
              <GlassCard variant="emerald" className="text-center">
                <div
                  className={cn(
                    "p-2 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.emerald.iconBg,
                    "dark:border-emerald-400/30 dark:bg-emerald-500/20",
                  )}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {stockSummary.availableQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Available
                </p>
              </GlassCard>
              <GlassCard variant="amber" className="text-center">
                <div
                  className={cn(
                    "p-2 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.amber.iconBg,
                    "dark:border-amber-400/30 dark:bg-amber-500/20",
                  )}
                >
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-lg sm:text-xl font-semibold text-amber-600 dark:text-amber-400">
                  {stockSummary.reservedQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Reserved
                </p>
              </GlassCard>
            </div>
          )}

          {/* Warehouse Information & Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            <GlassCard variant="cyan">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.cyan.iconBg,
                    "dark:border-cyan-400/30 dark:bg-cyan-500/20",
                  )}
                >
                  <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                  Warehouse Information
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-cyan-100/50 via-cyan-50/30 to-transparent dark:from-cyan-500/10 dark:via-cyan-500/5 dark:to-transparent border border-cyan-200/30 dark:border-cyan-400/10">
                  <Warehouse className="h-4 w-4 text-cyan-500 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <span className="ml-2 font-medium text-gray-700 dark:text-white">
                      {warehouse?.name}
                    </span>
                  </div>
                </div>

                {warehouse?.address && (
                  <div className="flex items-start gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <MapPin className="h-4 w-4 text-teal-500 dark:text-teal-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Address:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white block mt-1">
                        {warehouse?.address}
                      </span>
                    </div>
                  </div>
                )}

                {warehouse?.type && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                    <Tag className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Type:
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize font-medium text-sm px-3 py-1 rounded-full",
                        getWarehouseTypeBadgeClasses(warehouse?.type),
                      )}
                    >
                      {warehouse?.type}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-orange-100/50 via-orange-50/30 to-transparent dark:from-orange-500/10 dark:via-orange-500/5 dark:to-transparent border border-orange-200/30 dark:border-orange-400/10">
                  <Calendar className="h-4 w-4 text-orange-500 dark:text-orange-400 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    <ClientDateTime date={createdAt} />
                  </span>
                </div>

                {updatedAt && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-violet-100/50 via-violet-50/30 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10">
                    <Clock className="h-4 w-4 text-violet-500 dark:text-violet-400 shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Updated:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientRelativeTime date={updatedAt} />
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Stock by warehouse */}
            <GlassCard variant="violet">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.violet.iconBg,
                    "dark:border-violet-400/30 dark:bg-violet-500/20",
                  )}
                >
                  <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                    Stock in Warehouse
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Products allocated to this warehouse
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {isLoadingStock ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-white/50 dark:bg-white/10 animate-pulse rounded-xl"
                      />
                    ))}
                  </div>
                ) : stockAllocations && stockAllocations.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {stockAllocations.map((allocation, index) => {
                      const colors = [
                        "sky",
                        "emerald",
                        "amber",
                        "blue",
                        "teal",
                      ] as const;
                      const colorVariant = colors[index % colors.length];
                      return (
                        <div
                          key={allocation.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border transition-all duration-200 hover:scale-[1.02]",
                            `bg-gradient-to-r from-${colorVariant}-100/50 via-${colorVariant}-50/30 to-transparent dark:from-${colorVariant}-500/10 dark:via-${colorVariant}-500/5 dark:to-transparent`,
                            `border-${colorVariant}-200/30 dark:border-${colorVariant}-400/10`,
                          )}
                          style={{
                            background: `linear-gradient(to right, rgb(var(--${colorVariant === "sky" ? "14 165 233" : colorVariant === "emerald" ? "16 185 129" : colorVariant === "amber" ? "245 158 11" : colorVariant === "blue" ? "59 130 246" : "20 184 166"}) / 0.1), transparent)`,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-gray-700 dark:text-white">
                              {allocation.product?.name || "Unknown Product"}
                            </p>
                            {allocation.product?.sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SKU: {allocation.product.sku}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                              {allocation.quantity -
                                allocation.reservedQuantity}{" "}
                              <span className="text-gray-500 dark:text-gray-400 font-normal">
                                avail
                              </span>
                            </p>
                            {allocation.reservedQuantity > 0 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                {allocation.reservedQuantity} reserved
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-xl bg-white/30 dark:bg-white/5 border border-violet-200/30 dark:border-violet-400/10">
                    <div
                      className={cn(
                        "p-2 rounded-xl border w-fit mx-auto mb-3",
                        variantConfig.violet.iconBg,
                        "dark:border-violet-400/30 dark:bg-violet-500/20",
                      )}
                    >
                      <Package className="h-8 w-8 text-violet-500/50 dark:text-violet-400/50" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No stock allocated to this warehouse yet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Use the stock allocation feature to assign products
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigateTo(warehousesListHref)}
              className="w-full sm:w-auto gap-2 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleEdit}
              className="w-full sm:w-auto gap-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30 text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)] backdrop-blur-sm hover:border-blue-300/50 hover:from-blue-500/80 hover:via-blue-500/60 hover:to-blue-500/40 transition-all duration-300"
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Warehouse
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="w-full sm:w-auto gap-2 rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 text-white shadow-[0_10px_25px_rgba(225,29,72,0.35)] backdrop-blur-sm hover:border-rose-300/50 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 transition-all duration-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {isDeleting ? "Deleting..." : "Delete Warehouse"}
            </Button>
          </div>
        </div>

        <WarehouseDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingWarehouse(null);
          }}
          editingWarehouse={editingWarehouse}
          onEditWarehouse={(w) => setEditingWarehouse(w)}
        >
          <div style={{ display: "none" }} />
        </WarehouseDialog>

        <AlertDialogWrapper
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Are you absolutely sure?"
          description={`This will permanently delete the warehouse "${warehouse?.name}".`}
          actionLabel="Delete"
          actionLoadingLabel="Deleting..."
          isLoading={isDeleting}
          onAction={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          actionVariant="destructive"
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
