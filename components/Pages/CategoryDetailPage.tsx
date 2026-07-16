/**
 * Category Detail Page
 * Displays detailed information about a single category
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Calendar,
  Tag,
  BarChart3,
  ShoppingCart,
  Edit,
  Hash,
  Trash2,
  Copy,
  DollarSign,
  Wallet,
  FileText,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useForecastingSummary,
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
  DialogSubmitButton,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  AuditUserDetailRow,
  CatalogInsightsSection,
  CatalogSnapshotCompanion,
  DetailInfoRowGroup,
  CatalogDetailProductGrid,
  CatalogDetailRecentOrdersList,
  SectionTitleRow,
  GlassCard,
  GlassCardBody,
  GLASS_CARD_VARIANT_CONFIG as variantConfig,
} from "@/components/shared";
import { buildCategoryForecastRollup } from "@/lib/forecasting/category-forecast-rollup";
import {
  buildCatalogStockChartData,
  buildSalesChartData,
} from "@/lib/ui/catalog-insights-chart-data";
import type { ForecastingSummary } from "@/types";
import { DetailInfoRow } from "@/components/orders/detail";
import { ActiveInactiveBadge } from "@/lib/ui/semantic-badges";
import CategoryDialog from "@/components/category/CategoryDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import type { Category } from "@/types";
import {
  isDataSlotLoading,
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { cn } from "@/lib/utils";
import {
  TYPO_BODY_MUTED,
  TYPO_CARD_TITLE,
  TYPO_SUBTITLE,
} from "@/lib/ui/typography-scale";
import {
  APP_SHELL_DETAIL_CLASS,
  DETAIL_PAGE_HEADER_SPACING_CLASS,
} from "@/lib/ui/shell-layout-styles";

export type CategoryDetailPageProps = {
  embedInAdmin?: boolean;
  initialCategory?: Category;
  /** REQ-0082 — cache-read forecast for admin embed (non-blocking SSR). */
  initialForecasting?: ForecastingSummary | null;
};

export default function CategoryDetailPage({
  embedInAdmin,
  initialCategory,
  initialForecasting,
}: CategoryDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { handleBack, navigateTo } = useBackWithRefresh("category");
  const categoryId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;
  const isClientRole = user?.role === "client";
  const isSupplierRole = user?.role === "supplier";
  const isAdminRole = user?.role === "admin" || Boolean(embedInAdmin);
  const disableCrud = isClientRole || isSupplierRole;

  // Fetch category details
  const categoryQuery = useCategory(categoryId, initialCategory);
  const category = categoryQuery.data;
  const dataLoading = isDataSlotLoading(categoryQuery, initialCategory);

  useSyncSsrQueryData(queryKeys.categories.detail(categoryId), initialCategory);

  useSyncSsrQueryData(
    queryKeys.forecasting.summary(),
    initialForecasting ?? undefined,
  );

  const forecastQuery = useForecastingSummary(initialForecasting ?? undefined, {
    enabled: isAdminRole,
  });
  const forecastLoading = isDataSlotUnsettled(
    forecastQuery,
    initialForecasting ?? undefined,
  );

  const productsForForecast = category?.products ?? [];
  const productIdSet = useMemo(
    () => new Set(productsForForecast.map((p) => p.id)),
    [productsForForecast],
  );

  const categoryForecast = useMemo(() => {
    if (!isAdminRole || !forecastQuery.data || productIdSet.size === 0) {
      return null;
    }
    return buildCategoryForecastRollup(
      forecastQuery.data.forecasts,
      productIdSet,
    );
  }, [isAdminRole, forecastQuery.data, productIdSet]);

  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCopying = createCategoryMutation.isPending;
  const isDeleting = deleteCategoryMutation.isPending;

  const ownerProductsHref = (ownerId: string) =>
    embedInAdmin
      ? `/admin/products?ownerId=${ownerId}`
      : `/products?ownerId=${ownerId}`;

  const productHref = (productId: string) =>
    embedInAdmin ? `/admin/products/${productId}` : `/products/${productId}`;

  const supplierHref = (supplierId: string) =>
    embedInAdmin
      ? `/admin/suppliers/${supplierId}`
      : `/suppliers/${supplierId}`;

  const categoryHref = (id: string) =>
    embedInAdmin ? `/admin/categories/${id}` : `/categories/${id}`;

  const orderHref = (orderId: string) =>
    embedInAdmin ? `/admin/orders/${orderId}` : `/orders/${orderId}`;

  const invoiceHref = (invoiceId: string) =>
    embedInAdmin ? `/admin/invoices/${invoiceId}` : `/invoices/${invoiceId}`;

  // Edit: open category dialog with current category (same as CategoryActions via onEdit)
  const handleEditCategory = () => {
    if (!category) return;
    setEditingCategory(category as Category);
    setEditDialogOpen(true);
  };

  // Duplicate: create a copy (same as CategoryActions, use mutate + callbacks to avoid unhandled rejection)
  const handleDuplicateCategory = () => {
    if (!category || !user?.id) return;
    createCategoryMutation.mutate({
      name: `${category.name} (copy)`,
      userId: user.id,
      status: category.status ?? true,
      description: category.description ?? undefined,
      notes: category.notes ?? undefined,
    });
  };

  // Delete: confirm then delete (same pattern as SupplierActions / CategoryActions)
  const handleConfirmDeleteCategory = () => {
    if (!category) return;
    deleteCategoryMutation.mutate(category.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        navigateTo("/");
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
            <GlassCardBody>
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
            </GlassCardBody>
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
            <GlassCardBody>
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
            </GlassCardBody>
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

  const insights = category?.categoryInsights;
  const products = category?.products ?? [];
  const recentOrders = category?.recentOrders ?? [];

  const salesChartData = insights ? buildSalesChartData(insights) : [];
  const stockChartData = insights ? buildCatalogStockChartData(insights) : [];

  return (
    <PageWrapper>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            tone="amber"
            icon={Tag}
            leading={
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className={DETAIL_HEADER_BACK_ICON_CLASS}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            }
            title={
              dataLoading ? (
                <DataSlotPulse variant="text-lg" className="w-48" />
              ) : (
                category?.name && (
                  <CopyableText value={category.name}>
                    {category.name}
                  </CopyableText>
                )
              )
            }
            description={
              <ClientRelativeTime
                date={createdAt}
                prefix="Created "
                semantic="created"
              />
            }
            trailing={
              dataLoading ? (
                <DataSlotPulse variant="badge" className="self-center" />
              ) : category != null ? (
                <ActiveInactiveBadge
                  active={Boolean(category.status)}
                  className="self-center text-sm shrink-0"
                />
              ) : undefined
            }
          />

          {/* Category Information and Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Category Information */}
            <GlassCard variant="orange">
              <GlassCardBody>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/30 bg-orange-100/50 dark:border-white/15 dark:bg-white/10">
                    <Tag className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className={TYPO_CARD_TITLE}>Category Information</h3>
                    <p className={TYPO_SUBTITLE}>
                      Category metadata and audit fields
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {!dataLoading && category && (
                    <DetailInfoRow
                      icon={Hash}
                      label="Category ID:"
                      tone="violet"
                    >
                      <CopyableText value={category.id}>
                        <span className="font-mono text-xs">{category.id}</span>
                      </CopyableText>
                    </DetailInfoRow>
                  )}
                  <DetailInfoRow
                    icon={Tag}
                    label="Name:"
                    tone="orange"
                    loading={dataLoading}
                  >
                    {!dataLoading && category?.name && (
                      <CopyableText value={category.name}>
                        {category.name}
                      </CopyableText>
                    )}
                  </DetailInfoRow>
                  {!dataLoading && category && (
                    <DetailInfoRow icon={Tag} label="Status:" tone="emerald">
                      <ActiveInactiveBadge active={Boolean(category.status)} />
                    </DetailInfoRow>
                  )}
                  {!dataLoading && category?.description && (
                    <DetailInfoRow
                      icon={FileText}
                      label="Description:"
                      tone="amber"
                    >
                      {category.description}
                    </DetailInfoRow>
                  )}
                  {!dataLoading && category?.notes && (
                    <DetailInfoRow icon={StickyNote} label="Notes:" tone="teal">
                      {category.notes}
                    </DetailInfoRow>
                  )}
                  <DetailInfoRowGroup>
                    <DetailInfoRow
                      icon={Calendar}
                      label="Created:"
                      tone="teal"
                      loading={dataLoading}
                    >
                      {!dataLoading && (
                        <ClientDateTime date={createdAt} semantic="created" />
                      )}
                    </DetailInfoRow>
                    {(dataLoading || updatedAt) && (
                      <DetailInfoRow
                        icon={Calendar}
                        label="Updated:"
                        tone="sky"
                        loading={dataLoading}
                      >
                        {!dataLoading && updatedAt && (
                          <ClientDateTime date={updatedAt} semantic="updated" />
                        )}
                      </DetailInfoRow>
                    )}
                  </DetailInfoRowGroup>
                  {!dataLoading && category?.creator && (
                    <AuditUserDetailRow
                      label="Created by:"
                      tone="violet"
                      user={category.creator}
                      href={resolveAuditUserManagementHref(
                        category.creator.id,
                        isAdminRole,
                      )}
                    />
                  )}
                  {!dataLoading && category?.updater && (
                    <AuditUserDetailRow
                      label="Updated by:"
                      tone="blue"
                      user={category.updater}
                      href={resolveAuditUserManagementHref(
                        category.updater.id,
                        isAdminRole,
                      )}
                    />
                  )}
                </div>
              </GlassCardBody>
            </GlassCard>
            <GlassCard variant="teal">
              <GlassCardBody>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-100/50 dark:border-white/15 dark:bg-white/10">
                    <BarChart3 className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className={TYPO_CARD_TITLE}>Statistics</h3>
                    <p className={TYPO_SUBTITLE}>
                      Summary of products and sales data
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <DetailInfoRow
                    icon={Package}
                    label="Total Products:"
                    tone="sky"
                    loading={dataLoading}
                  >
                    {!dataLoading && stats.totalProducts}
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={Package}
                    label="Total Quantity Sold:"
                    tone="violet"
                    loading={dataLoading}
                  >
                    {!dataLoading && stats.totalQuantitySold}
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={DollarSign}
                    label="Total Revenue:"
                    tone="emerald"
                    loading={dataLoading}
                  >
                    {!dataLoading && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ${stats.totalRevenue.toFixed(2)}
                      </span>
                    )}
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={ShoppingCart}
                    label="Orders Containing Products:"
                    tone="amber"
                    loading={dataLoading}
                  >
                    {!dataLoading && stats.uniqueOrders}
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={Wallet}
                    label="Inventory value (list price):"
                    tone="blue"
                    loading={dataLoading}
                  >
                    {!dataLoading && (
                      <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-blue-600 dark:text-blue-400">
                          ${(stats.totalValue ?? 0).toFixed(2)}
                        </span>
                        <span className={cn("text-xs", TYPO_BODY_MUTED)}>
                          (price × on-hand qty)
                        </span>
                      </span>
                    )}
                  </DetailInfoRow>
                </div>
              </GlassCardBody>
            </GlassCard>
          </div>

          {/* REQ-0081/0084 — Category insights + charts */}
          {insights && (
            <CatalogInsightsSection
              insights={insights}
              dataLoading={dataLoading}
              isAdminRole={isAdminRole}
              forecastLoading={forecastLoading}
              title="Category Insights"
              subtitle="Derived demand and inventory signals"
              salesChartTitle="Sales Trend (6 months)"
              salesChartDescription="Revenue from category order lines"
              salesChartData={salesChartData}
              stockChartData={stockChartData}
              urgentReorderCount={categoryForecast?.urgentReorderCount}
              predictedDailyDemand={categoryForecast?.predictedDailyDemand}
              urgentRows={categoryForecast?.topUrgent}
              productHref={productHref}
              showUrgentForecastTable={
                isAdminRole &&
                (forecastLoading ||
                  (categoryForecast?.topUrgent.length ?? 0) > 0)
              }
              stockChartCompanion={
                <CatalogSnapshotCompanion
                  stats={stats}
                  stockSignals={{
                    lowStockCount: insights.lowStockCount,
                    outOfStockCount: insights.outOfStockCount,
                  }}
                  dataLoading={dataLoading}
                />
              }
            />
          )}

          {/* Products in this Category — REQ-0081 always visible */}
          <GlassCard variant="sky">
            <GlassCardBody>
              <SectionTitleRow
                as="h3"
                icon={Package}
                iconClassName="text-sky-600 dark:text-sky-400"
                iconTile
                title="Products in this Category"
                subtitle="Catalog products assigned to this category"
                count={
                  !dataLoading && products.length > 0
                    ? products.length
                    : undefined
                }
              />
              <CatalogDetailProductGrid
                loading={dataLoading}
                products={products}
                emptyMessage="No products in this category yet."
                productHref={productHref}
                ownerProductsHref={ownerProductsHref}
                supplierHref={supplierHref}
                categoryHref={categoryHref}
              />
            </GlassCardBody>
          </GlassCard>

          {/* Recent Orders — REQ-0081 ProductDetail parity */}
          <GlassCard variant="violet">
            <GlassCardBody>
              <SectionTitleRow
                as="h3"
                icon={ShoppingCart}
                iconClassName="text-violet-600 dark:text-violet-400"
                iconTile
                title="Recent Orders"
                subtitle="Latest orders for products in this category"
                count={
                  !dataLoading && recentOrders.length > 0
                    ? recentOrders.length
                    : undefined
                }
              />
              <CatalogDetailRecentOrdersList
                loading={dataLoading}
                orders={recentOrders}
                emptyMessage="No recent orders for products in this category."
                orderHref={orderHref}
                productHref={productHref}
                ownerProductsHref={ownerProductsHref}
                categoryHref={categoryHref}
                invoiceHref={invoiceHref}
                isAdminRole={isAdminRole}
              />
            </GlassCardBody>
          </GlassCard>

          {/* Actions — REQ-0081 glass footer parity with ProductDetailPage */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              onClick={handleBack}
              className={glassDetailBackButtonClass("w-full sm:w-auto gap-2")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleEditCategory}
              disabled={disableCrud}
              className={glassDetailFooterButtonClass("blue")}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Category
            </Button>
            <Button
              onClick={handleDuplicateCategory}
              disabled={isCopying || disableCrud}
              className={glassDetailFooterButtonClass("violet")}
            >
              <Copy className="h-4 w-4 shrink-0" />
              {isCopying ? "Duplicating..." : "Create Duplicate"}
            </Button>
            <DialogSubmitButton
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              isPending={isDeleting}
              pendingLabel="Deleting…"
              label="Delete Category"
              icon={Trash2}
              hue="rose"
              disabled={disableCrud}
              className="group w-full sm:w-auto gap-2"
            />
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
