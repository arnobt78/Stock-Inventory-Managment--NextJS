/**
 * Warehouse Detail Page
 * Displays detailed information about a single warehouse
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Tag,
  CheckCircle2,
  Edit,
  Package,
  Calendar,
  Clock,
  Building2,
  Boxes,
  ArrowRightLeft,
  Plus,
  Hash,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActiveInactiveBadge,
  WarehouseTypeBadge,
} from "@/lib/ui/semantic-badges";
import {
  useWarehouse,
  useDeleteWarehouse,
  useStockByWarehouse,
  useForecastingSummary,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDateTime,
  ClientRelativeTime,
  CopyableText,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  GLASS_GHOST_BUTTON,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  WarehouseInsightsSection,
} from "@/components/shared";
import { buildCategoryForecastRollup } from "@/lib/forecasting/category-forecast-rollup";
import { computeWarehouseInsights } from "@/lib/insights/warehouse-insights-compute";
import { DetailInfoRow } from "@/components/orders/detail";
import WarehouseDialog from "@/components/warehouses/WarehouseDialog";
import AllocateStockDialog from "@/components/warehouses/AllocateStockDialog";
import TransferStockDialog from "@/components/warehouses/TransferStockDialog";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { AlertDialogWrapper } from "@/components/dialogs";
import type {
  ForecastingSummary,
  Warehouse as WarehouseType,
  StockAllocation,
} from "@/types";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { cn } from "@/lib/utils";
import { APP_SHELL_DETAIL_CLASS, DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";

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
        "group rounded-[20px] border p-2 sm:p-4 backdrop-blur-md transition-all duration-300",
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

export type WarehouseDetailPageProps = {
  embedInAdmin?: boolean;
  initialWarehouse?: WarehouseType;
  /** REQ-0026 — SSR stock allocations for warehouse detail */
  initialStockAllocations?: StockAllocation[];
  /** REQ-0084 — cache-read forecast for admin (non-blocking SSR). */
  initialForecasting?: ForecastingSummary | null;
};

export default function WarehouseDetailPage({
  embedInAdmin,
  initialWarehouse,
  initialStockAllocations,
  initialForecasting,
}: WarehouseDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { navigateTo } = useBackWithRefresh("warehouse");
  const warehouseId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  const warehousesListHref = embedInAdmin ? "/admin/warehouses" : "/warehouses";

  const warehouseQuery = useWarehouse(warehouseId, initialWarehouse);
  const warehouse = warehouseQuery.data;
  const dataLoading = isDataSlotLoading(warehouseQuery, initialWarehouse);
  const stockQuery = useStockByWarehouse(warehouseId, initialStockAllocations);
  const stockAllocations = stockQuery.data;
  const isLoadingStock = isDataSlotLoading(stockQuery, initialStockAllocations);
  const deleteWarehouseMutation = useDeleteWarehouse();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const isDeleting = deleteWarehouseMutation.isPending;

  // REQ-0069 — SSR snapshots beat stale TanStack cache on warehouse navigation
  useSyncSsrQueryData(
    queryKeys.warehouses.detail(warehouseId),
    initialWarehouse,
  );
  useSyncSsrQueryData(
    queryKeys.stockAllocation.byWarehouse(warehouseId),
    initialStockAllocations,
  );
  useSyncSsrQueryData(
    queryKeys.forecasting.summary(),
    initialForecasting ?? undefined,
  );

  const isAdminRole = user?.role === "admin" || Boolean(embedInAdmin);
  const forecastQuery = useForecastingSummary(initialForecasting ?? undefined, {
    enabled: isAdminRole,
  });
  const forecastLoading = isDataSlotLoading(
    forecastQuery,
    initialForecasting ?? undefined,
  );

  const allocationRows = stockAllocations ?? initialStockAllocations ?? [];
  const productIdSet = useMemo(
    () => new Set(allocationRows.map((row) => row.productId)),
    [allocationRows],
  );

  const warehouseForecast = useMemo(() => {
    if (!isAdminRole || !forecastQuery.data || productIdSet.size === 0) {
      return null;
    }
    return buildCategoryForecastRollup(
      forecastQuery.data.forecasts,
      productIdSet,
    );
  }, [isAdminRole, forecastQuery.data, productIdSet]);

  const warehouseInsights = useMemo(() => {
    const rows = stockAllocations ?? initialStockAllocations ?? [];
    return computeWarehouseInsights(rows);
  }, [stockAllocations, initialStockAllocations]);

  const productHref = (productId: string) =>
    embedInAdmin ? `/admin/products/${productId}` : `/products/${productId}`;

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
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
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

  const createdAt = warehouse?.createdAt
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
        <div className={APP_SHELL_DETAIL_CLASS}>
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            tone="violet"
            icon={Warehouse}
            leading={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo(warehousesListHref)}
                aria-label="Back to Warehouses"
                className={DETAIL_HEADER_BACK_ICON_CLASS}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            }
            title={warehouse?.name}
            description={
              <ClientRelativeTime date={createdAt} prefix="Created " />
            }
          />

          {/* Status Card */}
          <GlassCard variant={warehouse?.status ? "emerald" : "rose"}>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
              Warehouse Status
            </p>
            <ActiveInactiveBadge
              active={Boolean(warehouse?.status)}
              className="text-sm"
            />
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
                <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
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
                <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
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
                <p className="text-sm sm:text-lg font-medium text-emerald-600 dark:text-emerald-400">
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
                <p className="text-sm sm:text-lg font-medium text-amber-600 dark:text-amber-400">
                  {stockSummary.reservedQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Reserved
                </p>
              </GlassCard>
            </div>
          )}

          {!isLoadingStock && (
            <WarehouseInsightsSection
              insights={warehouseInsights}
              dataLoading={isLoadingStock}
              isAdminRole={isAdminRole}
              forecastLoading={forecastLoading}
              urgentRows={warehouseForecast?.topUrgent}
              productHref={productHref}
              showUrgentForecastTable={
                isAdminRole &&
                (forecastLoading ||
                  (warehouseForecast?.topUrgent.length ?? 0) > 0)
              }
            />
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
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Warehouse Information
                </h3>
              </div>

              <div className="space-y-2">
                {warehouse && (
                  <DetailInfoRow
                    icon={Hash}
                    label="Warehouse ID:"
                    tone="violet"
                  >
                    <CopyableText value={warehouse.id}>
                      <span className="font-mono text-xs">{warehouse.id}</span>
                    </CopyableText>
                  </DetailInfoRow>
                )}
                <DetailInfoRow icon={Warehouse} label="Name:" tone="teal">
                  {warehouse?.name && (
                    <CopyableText value={warehouse.name}>
                      {warehouse.name}
                    </CopyableText>
                  )}
                </DetailInfoRow>
                {warehouse?.address && (
                  <DetailInfoRow icon={MapPin} label="Address:" tone="teal">
                    {warehouse.address}
                  </DetailInfoRow>
                )}
                {warehouse?.type && (
                  <DetailInfoRow icon={Tag} label="Type:" tone="blue">
                    <WarehouseTypeBadge
                      type={warehouse.type}
                      className="text-sm"
                    />
                  </DetailInfoRow>
                )}
                <DetailInfoRow
                  icon={CheckCircle2}
                  label="Status:"
                  tone="emerald"
                >
                  <ActiveInactiveBadge active={Boolean(warehouse?.status)} />
                </DetailInfoRow>
                <DetailInfoRow icon={Calendar} label="Created:" tone="orange">
                  <ClientDateTime date={createdAt} />
                </DetailInfoRow>
                {updatedAt && (
                  <DetailInfoRow icon={Clock} label="Updated:" tone="violet">
                    <ClientRelativeTime date={updatedAt} />
                  </DetailInfoRow>
                )}
                {stockSummary && (
                  <DetailInfoRow icon={Boxes} label="Allocations:" tone="sky">
                    {stockSummary.totalProducts} products ·{" "}
                    {stockSummary.totalQuantity} total ·{" "}
                    {stockSummary.availableQuantity} available ·{" "}
                    {stockSummary.reservedQuantity} reserved
                  </DetailInfoRow>
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
                  <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
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
                  <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden pr-1">
                    {stockAllocations.map((allocation) => {
                      const available =
                        allocation.quantity - allocation.reservedQuantity;
                      const product = allocation.product;
                      return (
                        <div
                          key={allocation.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-violet-200/30 bg-white/40 p-2 transition-all duration-200 hover:scale-[1.01] dark:border-violet-400/10 dark:bg-white/5"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <ProductThumb
                              name={product?.name || "Unknown Product"}
                              imageUrl={product?.imageUrl}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-700 dark:text-white">
                                {product?.name || "Unknown Product"}
                              </p>
                              {product?.sku ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  SKU: {product.sku}
                                </p>
                              ) : null}
                              {product?.categoryName ||
                              product?.supplierName ? (
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {[product.categoryName, product.supplierName]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-medium text-gray-700 dark:text-white">
                              {allocation.quantity}{" "}
                              <span className="font-normal text-gray-500 dark:text-gray-400">
                                total
                              </span>
                            </p>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {available}{" "}
                              <span className="font-normal text-gray-500 dark:text-gray-400">
                                available
                              </span>
                            </p>
                            {allocation.reservedQuantity > 0 ? (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                {allocation.reservedQuantity} reserved
                              </p>
                            ) : null}
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
              onClick={() => navigateTo(warehousesListHref)}
              className={glassDetailBackButtonClass("w-full sm:w-auto gap-2")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={() => setAllocateOpen(true)}
              disabled={dataLoading || !warehouse}
              className={glassDetailFooterButtonClass("violet")}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Allocate Stock
            </Button>
            <Button
              onClick={() => setTransferOpen(true)}
              disabled={
                dataLoading ||
                !warehouse ||
                !stockAllocations?.some(
                  (a) => a.quantity - a.reservedQuantity > 0,
                )
              }
              className={glassDetailFooterButtonClass("teal")}
            >
              <ArrowRightLeft className="h-4 w-4 shrink-0" />
              Transfer Stock
            </Button>
            <Button
              onClick={handleEdit}
              className={glassDetailFooterButtonClass("blue")}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Warehouse
            </Button>
            <DialogSubmitButton
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              isPending={isDeleting}
              pendingLabel="Deleting…"
              label="Delete Warehouse"
              icon={Trash2}
              hue="rose"
              className="group w-full sm:w-auto gap-2 !text-white"
            />
          </div>
        </div>

        <AllocateStockDialog
          open={allocateOpen}
          onOpenChange={setAllocateOpen}
          warehouseId={warehouseId}
          warehouseName={warehouse?.name}
        />

        <TransferStockDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          fromWarehouseId={warehouseId}
          fromWarehouseName={warehouse?.name}
          stockAllocations={stockAllocations}
        />

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
