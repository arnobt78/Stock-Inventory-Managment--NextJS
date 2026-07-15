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
  useDeleteStockAllocation,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { resolveAuditUserManagementHref } from "@/lib/navigation/audit-user-href";
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
  DetailInfoRowGroup,
  AuditUserDetailRow,
  GlassCard,
  GlassCardBody,
  SectionCountBadge,
  GLASS_CARD_VARIANT_CONFIG as variantConfig,
} from "@/components/shared";
import { buildCategoryForecastRollup } from "@/lib/forecasting/category-forecast-rollup";
import { computeWarehouseInsights, mapWarehouseStockSummary } from "@/lib/insights/warehouse-insights-compute";
import { DetailInfoRow } from "@/components/orders/detail";
import WarehouseDialog from "@/components/warehouses/WarehouseDialog";
import AllocateStockDialog from "@/components/warehouses/AllocateStockDialog";
import TransferStockDialog from "@/components/warehouses/TransferStockDialog";
import { WarehouseStockAllocationRow } from "@/components/warehouses/WarehouseStockAllocationRow";
import { AlertDialogWrapper } from "@/components/dialogs";
import type {
  ForecastingSummary,
  Warehouse as WarehouseType,
  StockAllocation,
} from "@/types";
import {
  isDataSlotLoading,
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { cn } from "@/lib/utils";
import { APP_SHELL_DETAIL_CLASS, DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import { detailStatValueToneClass } from "@/lib/ui/typography-scale";

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
  const isLoadingStock = isDataSlotUnsettled(stockQuery, initialStockAllocations);
  const deleteWarehouseMutation = useDeleteWarehouse();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editAllocation, setEditAllocation] = useState<StockAllocation | null>(
    null,
  );
  const [deleteAllocationTarget, setDeleteAllocationTarget] =
    useState<StockAllocation | null>(null);

  const deleteAllocationMutation = useDeleteStockAllocation();
  const isDeleting = deleteWarehouseMutation.isPending;
  const isRemovingAllocation = deleteAllocationMutation.isPending;

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
  const forecastLoading = isDataSlotUnsettled(
    forecastQuery,
    initialForecasting ?? undefined,
  );

  const allocationRows = useMemo(
    () => stockAllocations ?? initialStockAllocations ?? [],
    [stockAllocations, initialStockAllocations],
  );

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

  const warehouseInsights = useMemo(
    () => computeWarehouseInsights(allocationRows),
    [allocationRows],
  );

  const productHref = (productId: string) =>
    embedInAdmin ? `/admin/products/${productId}` : `/products/${productId}`;

  const categoryHref = (categoryId?: string | null) =>
    categoryId
      ? embedInAdmin
        ? `/admin/categories/${categoryId}`
        : `/categories/${categoryId}`
      : null;

  const supplierHref = (supplierId?: string | null) =>
    supplierId
      ? embedInAdmin
        ? `/admin/suppliers/${supplierId}`
        : `/suppliers/${supplierId}`
      : null;

  const canManageStock =
    user?.role === "admin" || user?.role === "supplier" || Boolean(embedInAdmin);

  const handleConfirmDeleteAllocation = () => {
    if (!deleteAllocationTarget) return;
    deleteAllocationMutation.mutate(
      {
        id: deleteAllocationTarget.id,
        productId: deleteAllocationTarget.productId,
        warehouseId: deleteAllocationTarget.warehouseId,
      },
      {
      onSuccess: () => setDeleteAllocationTarget(null),
      onError: () => setDeleteAllocationTarget(null),
    },
    );
  };

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
        navigateTo(warehousesListHref);
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
            <GlassCardBody>
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
            </GlassCardBody>
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

  // REQ-0114/0115 — stat cards share computeWarehouseInsights (SSR fallback when query empty)
  const stockSummary = mapWarehouseStockSummary(
    warehouseInsights,
    allocationRows.length,
  );

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
            <GlassCardBody>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
              Warehouse Status
            </p>
            <ActiveInactiveBadge
              active={Boolean(warehouse?.status)}
              className="text-sm"
            />
            </GlassCardBody>
          </GlassCard>

          {/* Stock Summary Statistics */}
          {stockSummary && stockSummary.totalProducts > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <GlassCard variant="sky" className="text-center">
                <GlassCardBody>
                  <div
                    className={cn(
                      "p-2 rounded-xl border w-fit mx-auto mb-2",
                      variantConfig.sky.iconBg,
                      "dark:border-sky-400/30 dark:bg-sky-500/20",
                    )}
                  >
                    <Boxes className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <p
                    className={cn(
                      "text-sm sm:text-base",
                      detailStatValueToneClass("sky"),
                    )}
                  >
                    {stockSummary.totalProducts}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Products
                  </p>
                </GlassCardBody>
              </GlassCard>
              <GlassCard variant="violet" className="text-center">
                <GlassCardBody>
                  <div
                    className={cn(
                      "p-2 rounded-xl border w-fit mx-auto mb-2",
                      variantConfig.violet.iconBg,
                      "dark:border-violet-400/30 dark:bg-violet-500/20",
                    )}
                  >
                    <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p
                    className={cn(
                      "text-sm sm:text-base",
                      detailStatValueToneClass("violet"),
                    )}
                  >
                    {stockSummary.totalQuantity}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Stock
                  </p>
                </GlassCardBody>
              </GlassCard>
              <GlassCard variant="emerald" className="text-center">
                <GlassCardBody>
                  <div
                    className={cn(
                      "p-2 rounded-xl border w-fit mx-auto mb-2",
                      variantConfig.emerald.iconBg,
                      "dark:border-emerald-400/30 dark:bg-emerald-500/20",
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p
                    className={cn(
                      "text-sm sm:text-lg",
                      detailStatValueToneClass("emerald"),
                    )}
                  >
                    {stockSummary.availableQuantity}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Available
                  </p>
                </GlassCardBody>
              </GlassCard>
              <GlassCard variant="amber" className="text-center">
                <GlassCardBody>
                  <div
                    className={cn(
                      "p-2 rounded-xl border w-fit mx-auto mb-2",
                      variantConfig.amber.iconBg,
                      "dark:border-amber-400/30 dark:bg-amber-500/20",
                    )}
                  >
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p
                    className={cn(
                      "text-sm sm:text-lg",
                      detailStatValueToneClass("amber"),
                    )}
                  >
                    {stockSummary.reservedQuantity}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Reserved
                  </p>
                </GlassCardBody>
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
              <GlassCardBody>
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
                <DetailInfoRowGroup>
                  <DetailInfoRow icon={Calendar} label="Created:" tone="orange">
                    <ClientDateTime date={createdAt} />
                  </DetailInfoRow>
                  {updatedAt && (
                    <DetailInfoRow icon={Clock} label="Updated:" tone="violet">
                      <ClientRelativeTime date={updatedAt} />
                    </DetailInfoRow>
                  )}
                </DetailInfoRowGroup>
                {stockSummary && (
                  <DetailInfoRow icon={Boxes} label="Allocations:" tone="sky">
                    <span className="inline-flex flex-wrap items-center gap-x-1.5">
                      <span className="text-slate-600 dark:text-slate-300">
                        {stockSummary.totalProducts} Products
                      </span>
                      <span className="text-gray-400 dark:text-white/30">·</span>
                      <span className="text-sky-600 dark:text-sky-400">
                        {stockSummary.totalQuantity} Total
                      </span>
                      <span className="text-gray-400 dark:text-white/30">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {stockSummary.availableQuantity} Available
                      </span>
                      <span className="text-gray-400 dark:text-white/30">·</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {stockSummary.reservedQuantity} Reserved
                      </span>
                    </span>
                  </DetailInfoRow>
                )}
                {warehouse?.creator && (
                  <AuditUserDetailRow
                    label="Created by:"
                    tone="violet"
                    user={warehouse.creator}
                    href={resolveAuditUserManagementHref(
                      warehouse.creator.id,
                      isAdminRole,
                    )}
                  />
                )}
                {warehouse?.updater && (
                  <AuditUserDetailRow
                    label="Updated by:"
                    tone="blue"
                    user={warehouse.updater}
                    href={resolveAuditUserManagementHref(
                      warehouse.updater.id,
                      isAdminRole,
                    )}
                  />
                )}
              </div>
              </GlassCardBody>
            </GlassCard>

            {/* Stock by warehouse */}
            <GlassCard variant="violet">
              <GlassCardBody>
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Stock in Warehouse
                    </h3>
                    {!isLoadingStock &&
                    stockAllocations &&
                    stockAllocations.length > 0 ? (
                      <SectionCountBadge>
                        {stockAllocations.length} products
                      </SectionCountBadge>
                    ) : null}
                  </div>
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
                  <div className="space-y-2">
                    {stockAllocations.map((allocation) => {
                      const isArchived = allocation.product?.isArchived === true;
                      return (
                      <WarehouseStockAllocationRow
                        key={allocation.id}
                        allocation={allocation}
                        productHref={productHref(allocation.productId)}
                        categoryHref={categoryHref(
                          allocation.product?.categoryId,
                        )}
                        supplierHref={supplierHref(
                          allocation.product?.supplierId,
                        )}
                        disableActions={!canManageStock || isArchived}
                        onEdit={
                          canManageStock && !isArchived
                            ? () => {
                                setEditAllocation(allocation);
                                setAllocateOpen(true);
                              }
                            : undefined
                        }
                        onDelete={
                          canManageStock && !isArchived
                            ? () => setDeleteAllocationTarget(allocation)
                            : undefined
                        }
                      />
                    );})}
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
              </GlassCardBody>
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
              onClick={() => {
                setEditAllocation(null);
                setAllocateOpen(true);
              }}
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
          key={editAllocation?.id ?? "allocate-new"}
          open={allocateOpen}
          onOpenChange={(open) => {
            setAllocateOpen(open);
            if (!open) setEditAllocation(null);
          }}
          warehouseId={warehouseId}
          warehouseName={warehouse?.name}
          editAllocation={editAllocation}
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

        <AlertDialogWrapper
          open={Boolean(deleteAllocationTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteAllocationTarget(null);
          }}
          title="Remove warehouse allocation?"
          description={`Remove ${deleteAllocationTarget?.product?.name ?? "this product"} from ${warehouse?.name ?? "this warehouse"}? Catalog total is unchanged; only the warehouse row is deleted.`}
          actionLabel="Remove"
          actionLoadingLabel="Removing..."
          isLoading={isRemovingAllocation}
          onAction={handleConfirmDeleteAllocation}
          onCancel={() => setDeleteAllocationTarget(null)}
          actionVariant="destructive"
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
