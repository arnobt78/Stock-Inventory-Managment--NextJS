/**
 * Category Detail Page
 * Displays detailed information about a single category
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Hash,
  Trash2,
  Copy,
  DollarSign,
  Wallet,
  FileText,
  StickyNote,
  Truck,
  Clock,
  AlertTriangle,
  PackageX,
  TrendingUp,
  AlertCircle,
  Sparkles,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useForecastingSummary,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
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
  AvatarInlineLink,
  SectionTitleRow,
  ListIndexBadge,
} from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { ChartCard } from "@/components/ui/chart-card";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import {
  CHART_LABEL_TOP_MARGIN,
  createChartBarLabelRenderer,
  formatChartCurrencyLabel,
} from "@/lib/ui/chart-point-label";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import { buildCategoryForecastRollup } from "@/lib/forecasting/category-forecast-rollup";
import type { ForecastingSummary } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DetailInfoRow } from "@/components/orders/detail";
import {
  ActiveInactiveBadge,
  OrderStatusBadge,
} from "@/lib/ui/semantic-badges";
import CategoryDialog from "@/components/category/CategoryDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import type { Category } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
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
  const { handleBack } = useBackWithRefresh("category");
  const categoryId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;
  const isClientRole = user?.role === "client";
  const isSupplierRole = user?.role === "supplier";
  const isAdminRole = user?.role === "admin" || embedInAdmin;
  const disableCrud = isClientRole || isSupplierRole;

  // Fetch category details
  const categoryQuery = useCategory(categoryId, initialCategory);
  const category = categoryQuery.data;
  const dataLoading = isDataSlotLoading(categoryQuery, initialCategory);

  useSyncSsrQueryData(queryKeys.categories.detail(categoryId), initialCategory);

  const forecastQuery = useForecastingSummary(initialForecasting ?? undefined, {
    enabled: isAdminRole,
  });
  const forecastLoading = isDataSlotLoading(
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

  const orderHref = (orderId: string) =>
    embedInAdmin ? `/admin/orders/${orderId}` : `/orders/${orderId}`;

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

  const insights = category?.categoryInsights;
  const products = category?.products ?? [];
  const recentOrders = category?.recentOrders ?? [];

  const salesChartData =
    insights?.salesTrend.map((point) => ({
      label: point.month,
      revenue: Number(point.revenue.toFixed(2)),
      units: point.units,
    })) ?? [];

  const stockChartData = insights
    ? [
        { name: "Available", value: insights.stockBreakdown.available },
        { name: "Low stock", value: insights.stockBreakdown.low },
        { name: "Out of stock", value: insights.stockBreakdown.out },
      ].filter((row) => row.value > 0)
    : [];

  const STOCK_PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

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
              <div className="p-2 sm:p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/30 bg-orange-100/50 dark:border-white/15 dark:bg-white/10">
                    <Tag className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Category Information
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Category metadata and audit fields
                    </p>
                  </div>
                </div>

              <div className="space-y-2">
                {!dataLoading && category && (
                  <DetailInfoRow icon={Hash} label="Category ID:" tone="violet">
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
                  <DetailInfoRow icon={FileText} label="Description:" tone="amber">
                    {category.description}
                  </DetailInfoRow>
                )}
                {!dataLoading && category?.notes && (
                  <DetailInfoRow icon={StickyNote} label="Notes:" tone="teal">
                    {category.notes}
                  </DetailInfoRow>
                )}
                <DetailInfoRow
                  icon={Calendar}
                  label="Created:"
                  tone="teal"
                  loading={dataLoading}
                >
                  {!dataLoading && <ClientDateTime date={createdAt} />}
                </DetailInfoRow>
                {(dataLoading || updatedAt) && (
                  <DetailInfoRow
                    icon={Calendar}
                    label="Updated:"
                    tone="sky"
                    loading={dataLoading}
                  >
                    {!dataLoading && updatedAt && (
                      <ClientDateTime date={updatedAt} />
                    )}
                  </DetailInfoRow>
                )}
                {!dataLoading && category?.creator && (
                  <>
                    <DetailInfoRow
                      icon={User}
                      label="Created by:"
                      tone="violet"
                    >
                      <AvatarInlineLink
                        seed={category.creator.id}
                        image={category.creator.image}
                        label={category.creator.name ?? category.creator.email}
                        href={ownerProductsHref(category.creator.id)}
                      />
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={Mail}
                      label="Creator email:"
                      tone="violet"
                    >
                      <CopyableText value={category.creator.email}>
                        {category.creator.email}
                      </CopyableText>
                    </DetailInfoRow>
                  </>
                )}
                {!dataLoading && category?.updater && (
                  <>
                    <DetailInfoRow icon={User} label="Updated by:" tone="blue">
                      {category.updater.name}
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={Mail}
                      label="Updater email:"
                      tone="blue"
                    >
                      {category.updater.email}
                    </DetailInfoRow>
                  </>
                )}
              </div>
              </div>
            </GlassCard>
            <GlassCard variant="teal">
              <div className="p-2 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-100/50 dark:border-white/15 dark:bg-white/10">
                    <BarChart3 className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Statistics
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-white/60">
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
                    label="Current Stock Value:"
                    tone="blue"
                    loading={dataLoading}
                  >
                    {!dataLoading && (
                      <span className="text-blue-600 dark:text-blue-400">
                        ${stats.totalValue.toFixed(2)}
                      </span>
                    )}
                  </DetailInfoRow>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* REQ-0081 — Category insights + charts */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
              <GlassCard variant="emerald">
                <div className="p-2 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-100/50 dark:border-white/15 dark:bg-white/10">
                      <TrendingUp className="h-4 w-4 text-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                        Category Insights
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-white/60">
                        Derived demand and inventory signals
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <DetailInfoRow
                      icon={AlertTriangle}
                      label="Low stock products:"
                      tone="amber"
                      loading={dataLoading}
                    >
                      {!dataLoading && insights.lowStockCount}
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={PackageX}
                      label="Out of stock:"
                      tone="rose"
                      loading={dataLoading}
                    >
                      {!dataLoading && insights.outOfStockCount}
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={DollarSign}
                      label="Avg order value:"
                      tone="emerald"
                      loading={dataLoading}
                    >
                      {!dataLoading && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ${insights.avgOrderValue.toFixed(2)}
                        </span>
                      )}
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={TrendingUp}
                      label="Demand velocity (units/day):"
                      tone="violet"
                      loading={dataLoading}
                    >
                      {!dataLoading && insights.demandVelocity.toFixed(2)}
                    </DetailInfoRow>
                    {isAdminRole && (
                      <>
                        <DetailInfoRow
                          icon={AlertCircle}
                          label="Urgent reorder:"
                          tone="rose"
                          loading={forecastLoading}
                        >
                          {!forecastLoading &&
                            categoryForecast?.urgentReorderCount}
                        </DetailInfoRow>
                        <DetailInfoRow
                          icon={Sparkles}
                          label="Predicted daily demand:"
                          tone="sky"
                          loading={forecastLoading}
                        >
                          {!forecastLoading &&
                            categoryForecast?.predictedDailyDemand.toFixed(1)}
                        </DetailInfoRow>
                      </>
                    )}
                  </div>
                </div>
              </GlassCard>

              <ChartCard
                title="Sales trend (6 months)"
                description="Revenue from category order lines"
                icon={BarChart3}
                variant="sky"
              >
                <DeferredChartSection
                  loading={dataLoading}
                  hasData={salesChartData.length > 0}
                >
                  <ResponsiveChartContainer>
                    <BarChart
                      data={salesChartData}
                      margin={{
                        top: CHART_LABEL_TOP_MARGIN,
                        right: 8,
                        left: 8,
                        bottom: 8,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="hsl(var(--chart-1))"
                        name="Revenue"
                        radius={[4, 4, 0, 0]}
                        label={createChartBarLabelRenderer(
                          formatChartCurrencyLabel,
                        )}
                      />
                    </BarChart>
                  </ResponsiveChartContainer>
                </DeferredChartSection>
              </ChartCard>

              <ChartCard
                title="Stock breakdown"
                description="Available vs low vs out of stock"
                icon={PieChartIcon}
                variant="amber"
              >
                <DeferredChartSection
                  loading={dataLoading}
                  hasData={stockChartData.length > 0}
                >
                  <ResponsiveChartContainer>
                    <PieChart>
                      <Pie
                        data={stockChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {stockChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STOCK_PIE_COLORS[index % STOCK_PIE_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveChartContainer>
                </DeferredChartSection>
              </ChartCard>

              {isAdminRole &&
                (forecastLoading ||
                  (categoryForecast &&
                    categoryForecast.topUrgent.length > 0)) && (
                  <GlassCard variant="rose" className="lg:col-span-2">
                    <div className="p-2 sm:p-4">
                      <SectionTitleRow
                        as="h3"
                        title="Urgent reorder forecast"
                        count={
                          !forecastLoading
                            ? categoryForecast?.topUrgent.length
                            : undefined
                        }
                      />
                      <div className="mt-4 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Available</TableHead>
                              <TableHead>Days left</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          {forecastLoading ? (
                            <TableBodyPulseRows rows={5} columnCount={5} />
                          ) : (
                            <TableBody>
                              {categoryForecast!.topUrgent.map((row) => (
                                <TableRow key={row.productId}>
                                  <TableCell>
                                    <Link
                                      href={productHref(row.productId)}
                                      className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                                    >
                                      {row.productName}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {row.sku}
                                  </TableCell>
                                  <TableCell>{row.availableStock}</TableCell>
                                  <TableCell>
                                    {row.daysUntilStockout ?? "∞"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="destructive">
                                      {row.reorderRecommendation}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          )}
                        </Table>
                      </div>
                    </div>
                  </GlassCard>
                )}
            </div>
          )}

          {/* Products in this Category — REQ-0081 always visible */}
          <GlassCard variant="sky">
            <div className="p-2 sm:p-4">
              <SectionTitleRow
                as="h3"
                title="Products in this Category"
                count={
                  !dataLoading && products.length > 0
                    ? products.length
                    : undefined
                }
              />
              {dataLoading ? (
                <div className="mt-4 space-y-2">
                  <DataSlotPulse variant="text-md" />
                  <DataSlotPulse variant="text-md" />
                </div>
              ) : products.length === 0 ? (
                <p className={cn(CARD_EMPTY_MESSAGE_CLASS, "mt-4")}>
                  No products in this category yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <ProductThumb
                          name={product.name}
                          imageUrl={product.imageUrl}
                          size="lg"
                          className="rounded-xl shrink-0"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Link
                            href={productHref(product.id)}
                            className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-gray-600 dark:text-white/60 flex items-center gap-1.5 flex-wrap min-w-0">
                            <Hash className="h-3.5 w-3.5 shrink-0" />
                            <CopyableText value={product.sku ?? ""}>
                              <span className="font-mono">{product.sku}</span>
                            </CopyableText>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-white/60 flex items-center gap-1.5 flex-wrap">
                            <Package className="h-3.5 w-3.5 shrink-0" />
                            Stock: {product.quantity ?? 0}
                            {(product.reservedQuantity ?? 0) > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                {product.reservedQuantity} reserved
                              </>
                            )}
                            <span className="text-gray-400">•</span>
                            <DollarSign className="h-3.5 w-3.5 shrink-0" />$
                            {(product.price ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {(product.owner || product.supplier) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-white/60">
                          {product.owner && (
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              Owner:{" "}
                              <AvatarInlineLink
                                seed={product.owner.id}
                                image={product.owner.image}
                                label={
                                  product.owner.name ??
                                  product.owner.email ??
                                  "Owner"
                                }
                                href={ownerProductsHref(product.owner.id)}
                                size={20}
                              />
                            </span>
                          )}
                          {product.supplier && (
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <Truck className="h-3.5 w-3.5 shrink-0" />
                              Supplier:{" "}
                              <AvatarInlineLink
                                seed={product.supplier.id}
                                label={product.supplier.name}
                                href={supplierHref(product.supplier.id)}
                                size={20}
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Recent Orders — REQ-0081 ProductDetail parity */}
          <GlassCard variant="violet">
            <div className="p-2 sm:p-4">
              <SectionTitleRow
                as="h3"
                title="Recent Orders"
                count={
                  !dataLoading && recentOrders.length > 0
                    ? recentOrders.length
                    : undefined
                }
              />
              {dataLoading ? (
                <div className="mt-4 space-y-2">
                  <DataSlotPulse variant="text-md" />
                  <DataSlotPulse variant="text-md" />
                </div>
              ) : recentOrders.length === 0 ? (
                <p className={cn(CARD_EMPTY_MESSAGE_CLASS, "mt-4")}>
                  No recent orders for products in this category.
                </p>
              ) : (
                <div className="space-y-2 mt-4">
                  {recentOrders.map((order, index) => {
                    const buyerLabel =
                      order.placedBy?.name?.trim() ||
                      order.placedBy?.email ||
                      "Unknown buyer";
                    return (
                      <div
                        key={order.id}
                        className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ListIndexBadge index={index + 1} />
                              <CopyableText
                                value={order.orderNumber}
                                className="min-w-0"
                              >
                                <Link
                                  href={orderHref(order.orderId)}
                                  className="font-normal text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                                >
                                  {order.orderNumber}
                                </Link>
                              </CopyableText>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-white/60 flex items-center gap-1.5 flex-wrap min-w-0">
                              <ProductThumb
                                name={order.productName}
                                imageUrl={order.productImageUrl}
                                size="sm"
                                className="rounded-lg shrink-0"
                              />
                              <Link
                                href={productHref(order.productId)}
                                className="font-normal text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                              >
                                {order.productName}
                              </Link>
                              {order.productSku && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <Hash className="h-3.5 w-3.5 shrink-0" />
                                  <CopyableText value={order.productSku}>
                                    <span className="font-mono text-xs">
                                      {order.productSku}
                                    </span>
                                  </CopyableText>
                                </>
                              )}
                              <span className="text-gray-400">•</span>
                              <Package className="h-3.5 w-3.5 shrink-0" />
                              Qty: {order.quantity} × ${order.price.toFixed(2)}
                              <span className="text-gray-400">•</span>
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <ClientDate date={order.orderDate} />
                            </p>
                            {(order.owner || order.placedBy) && (
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-white/60">
                                {order.owner && (
                                  <span className="inline-flex items-center gap-1.5 min-w-0">
                                    <User className="h-3.5 w-3.5 shrink-0" />
                                    Owner:{" "}
                                    <AvatarInlineLink
                                      seed={order.owner.id}
                                      image={order.owner.image}
                                      label={
                                        order.owner.name ??
                                        order.owner.email ??
                                        "Owner"
                                      }
                                      href={ownerProductsHref(order.owner.id)}
                                      size={20}
                                    />
                                  </span>
                                )}
                                {order.placedBy && (
                                  <span className="inline-flex items-center gap-1.5 min-w-0">
                                    <User className="h-3.5 w-3.5 shrink-0" />
                                    Buyer:{" "}
                                    {isAdminRole ? (
                                      <AvatarInlineLink
                                        seed={order.placedBy.id}
                                        image={order.placedBy.image}
                                        label={buyerLabel}
                                        href={`/admin/user-management/${order.placedBy.id}`}
                                        size={20}
                                      />
                                    ) : (
                                      <AvatarInlineLink
                                        seed={order.placedBy.id}
                                        image={order.placedBy.image}
                                        label={buyerLabel}
                                        size={20}
                                      />
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-left sm:text-right shrink-0">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
