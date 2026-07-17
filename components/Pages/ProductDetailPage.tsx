/**
 * Product Detail Page
 * Displays detailed information about a single product
 */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  ShoppingCart,
  BarChart3,
  QrCode,
  Image as ImageIcon,
  Edit,
  Copy,
  Trash2,
  Building2,
  MapPin,
  Wallet,
  Hash,
  Activity,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProductStockStatusBadge,
  ActiveInactiveBadge,
  WarehouseTypeBadge,
  productStockAvailableTextClass,
} from "@/lib/ui/semantic-badges";
import { Separator } from "@/components/ui/separator";
import {
  useProduct,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useStockByProduct,
  useForecastingSummary,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { resolveAuditUserManagementHref } from "@/lib/navigation/audit-user-href";
import { useAuth } from "@/contexts";
import { useProductStore } from "@/stores";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  ClientRelativeTime,
  CopyableText,
  AuditUserDetailRow,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  SectionTitleRow,
  SectionCountBadge,
  PersonInlineRow,
  CatalogInsightsSection,
  CatalogAllocationSummaryText,
  DetailInfoRowGroup,
  GlassCard,
  GlassCardBody,
  GLASS_CARD_VARIANT_CONFIG as variantConfig,
} from "@/components/shared";
import { CatalogDetailRecentOrdersList } from "@/components/shared/catalog-detail/CatalogDetailRecentOrdersList";
import type { CatalogDetailRecentOrderItem } from "@/types/catalog-detail-lists";
import { findProductForecast } from "@/lib/forecasting/entity-forecast";
import { enrichProductInsightsWithWarehouseStock } from "@/lib/insights/product-insights-enrich";
import { sumAllocatedQuantity } from "@/lib/insights/warehouse-stock-aggregate";
import { formatCatalogCommitWarehouseHint } from "@/lib/stock-allocation/catalog-allocation-copy";
import {
  computeCommittedQuantity,
  getDisplayCommittedQuantity,
} from "@/lib/products/enrich-product-committed-quantity";
import {
  buildSalesChartData,
  buildWarehouseAllocationStockChartData,
  WAREHOUSE_STOCK_PIE_COLORS,
} from "@/lib/ui/catalog-insights-chart-data";
import { DetailInfoRow } from "@/components/orders/detail";
import {
  isDataSlotLoading,
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
  useSyncSsrQueryDataMany,
} from "@/lib/react-query";
import type {
  Product,
  ProductStatus,
  ProductReview,
  StockAllocation,
  ForecastingSummary,
} from "@/types";
import type { ReviewEligibilityResult } from "@/lib/server/product-reviews-detail-data";
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
import { getWarehouseTypeIcon } from "@/lib/ui/warehouse-type-styles";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import { SafeImage } from "@/components/ui/safe-image";
import ProductFormDialog from "@/components/products/ProductFormDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";

export type ProductDetailPageProps = {
  embedInAdmin?: boolean;
  initialProduct?: Product;
  /** REQ-0026 — SSR reviews for product detail */
  initialReviews?: ProductReview[];
  initialEligibility?: ReviewEligibilityResult;
  /** REQ-0066 — per-warehouse stock breakdown */
  initialStockByProduct?: StockAllocation[];
  /** REQ-0084 — cache-read forecast for admin embed (non-blocking SSR). */
  initialForecasting?: ForecastingSummary | null;
};

export default function ProductDetailPage({
  embedInAdmin,
  initialProduct,
  initialReviews,
  initialEligibility,
  initialStockByProduct,
  initialForecasting,
}: ProductDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { handleBack, navigateTo } = useBackWithRefresh("product");
  const productId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  // Fetch product details
  const productQuery = useProduct(productId, initialProduct);
  const product = productQuery.data;
  const dataLoading = isDataSlotLoading(productQuery, initialProduct);
  const stockByProductQuery = useStockByProduct(
    productId,
    initialStockByProduct,
  );
  const warehouseAllocations = stockByProductQuery.data ?? [];
  const warehouseStockLoading = isDataSlotUnsettled(
    stockByProductQuery,
    initialStockByProduct,
  );

  useSyncSsrQueryDataMany([
    {
      queryKey: queryKeys.products.detail(productId),
      serverData: initialProduct,
    },
    {
      queryKey: queryKeys.stockAllocation.byProduct(productId),
      serverData: initialStockByProduct,
    },
  ]);

  const { data: allProducts = [] } = useProducts();
  const { setSelectedProduct, setOpenProductDialog } = useProductStore();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCopying = createProductMutation.isPending;
  const isDeleting = deleteProductMutation.isPending;
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const isAdminRole = user?.role === "admin" || Boolean(embedInAdmin);
  const disableCrud = isSupplierRole || isClientRole;

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
  const productForecast = useMemo(() => {
    if (!isAdminRole || !forecastQuery.data) return null;
    return findProductForecast(forecastQuery.data.forecasts, productId);
  }, [isAdminRole, forecastQuery.data, productId]);

  const baseInsights = product?.productInsights;
  const catalogQuantity =
    product?.quantity != null ? Number(product.quantity) : undefined;

  const insights = useMemo(
    () =>
      baseInsights
        ? enrichProductInsightsWithWarehouseStock(
            baseInsights,
            warehouseAllocations,
            catalogQuantity,
          )
        : null,
    [baseInsights, warehouseAllocations, catalogQuantity],
  );

  const warehouseLinkAllowed = !isSupplierRole && !isClientRole;
  const showWarehouseStockCard =
    !isClientRole || warehouseAllocations.length > 0;
  const totalWarehouseAvailable = warehouseAllocations.reduce(
    (sum, row) => sum + (row.quantity - row.reservedQuantity),
    0,
  );
  const allocatedTotal = useMemo(
    () => sumAllocatedQuantity(warehouseAllocations),
    [warehouseAllocations],
  );
  // REQ-0105 — shared display helper; warehouse fallback when TanStack lags stock hook
  const displayCommitted = useMemo(() => {
    if (product?.committedQuantity != null) {
      return getDisplayCommittedQuantity(product);
    }
    const allocationReservedSum = warehouseAllocations.reduce(
      (sum, row) => sum + row.reservedQuantity,
      0,
    );
    return computeCommittedQuantity(
      product?.reservedQuantity ?? 0,
      allocationReservedSum,
    );
  }, [product, warehouseAllocations]);
  const catalogAvailableQty = useMemo(() => {
    if (catalogQuantity == null) return undefined;
    return Math.max(0, catalogQuantity - displayCommitted);
  }, [catalogQuantity, displayCommitted]);
  /** REQ-0138 — structured summary for colored CatalogAllocationSummaryText */
  const allocationSummaryParts = useMemo(() => {
    if (catalogQuantity == null) return null;
    return {
      catalogQty: catalogQuantity,
      allocatedTotal,
      unallocated: Math.max(0, catalogQuantity - allocatedTotal),
      reservedCommitment: displayCommitted,
    };
  }, [catalogQuantity, allocatedTotal, displayCommitted]);
  const recentOrderCount = product?.recentOrders?.length ?? 0;
  const ownerProductsHref = (ownerId: string) =>
    embedInAdmin
      ? `/admin/products?ownerId=${ownerId}`
      : `/products?ownerId=${ownerId}`;
  const orderHref = (orderId: string) =>
    embedInAdmin ? `/admin/orders/${orderId}` : `/orders/${orderId}`;

  const categoryHref = (id: string) =>
    embedInAdmin ? `/admin/categories/${id}` : `/categories/${id}`;

  const invoiceHref = (invoiceId: string) =>
    embedInAdmin ? `/admin/invoices/${invoiceId}` : `/invoices/${invoiceId}`;

  const catalogRecentOrders = useMemo((): CatalogDetailRecentOrderItem[] => {
    if (!product?.recentOrders?.length || !product.id) return [];
    const productCategory =
      product.category && typeof product.category === "object"
        ? {
            id: (product.category as { id: string }).id,
            name: (product.category as { name: string }).name,
          }
        : null;
    return product.recentOrders.map((order) => {
      const row = order as CatalogDetailRecentOrderItem & {
        owner?: CatalogDetailRecentOrderItem["owner"];
        category?: CatalogDetailRecentOrderItem["category"];
        invoiceForOrder?: CatalogDetailRecentOrderItem["invoiceForOrder"];
      };
      return {
        ...row,
        productId: product.id,
        productName: product.name ?? "",
        productSku: product.sku ?? null,
        productImageUrl: product.imageUrl ?? null,
        // REQ-0143 — prefer SSR owner/category/invoice; fall back for older cache
        owner:
          row.owner ??
          (product.creator
            ? {
                id: product.creator.id,
                name: product.creator.name,
                email: product.creator.email,
                image: product.creator.image ?? null,
              }
            : null),
        category: row.category ?? productCategory,
        invoiceForOrder: row.invoiceForOrder ?? null,
      };
    });
  }, [product]);

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
    createProductMutation.mutate({
      name: `${product?.name} (copy)`,
      sku: uniqueSku,
      price: product?.price,
      quantity: product?.quantity,
      status: (product?.status as ProductStatus) || "Available",
      categoryId: product?.categoryId,
      supplierId: product?.supplierId,
      userId: product?.userId,
    });
  };

  // Delete: confirm then delete (same as ProductActions)
  const handleConfirmDeleteProduct = () => {
    if (!product) return;
    deleteProductMutation.mutate(product?.id, {
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
  if (productQuery.isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <div className="text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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

  const salesChartData = insights ? buildSalesChartData(insights) : [];
  const stockChartData = insights
    ? buildWarehouseAllocationStockChartData(insights)
    : [];
  const warehouseStockChartTrailing =
    insights?.warehouseStock && catalogQuantity != null && !dataLoading ? (
      <>
        <SectionCountBadge>
          {insights.warehouseStock.available} in warehouses
        </SectionCountBadge>
        {insights.warehouseStock.unallocated != null &&
        insights.warehouseStock.unallocated > 0 ? (
          <SectionCountBadge hue="amber">
            {insights.warehouseStock.unallocated} unallocated
          </SectionCountBadge>
        ) : null}
        <SectionCountBadge hue="sky">
          {catalogQuantity} catalog
        </SectionCountBadge>
      </>
    ) : undefined;

  const productHref = (id: string) =>
    embedInAdmin ? `/admin/products/${id}` : `/products/${id}`;

  return (
    <PageWrapper>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          {/* Header */}
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            tone="rose"
            icon={Package}
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
                <CopyableText value={product!.name}>
                  {product!.name}
                </CopyableText>
              )
            }
            description={
              dataLoading ? (
                <DataSlotPulse variant="text-sm" className="w-40" />
              ) : (
                <>
                  SKU:{" "}
                  <CopyableText value={product!.sku}>
                    {product!.sku}
                  </CopyableText>{" "}
                  • Created{" "}
                  <ClientRelativeTime date={createdAt} semantic="created" />
                </>
              )
            }
          />

          {/* REQ-0139 — Status/Stock/Price stretch to image/QR column height */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 items-stretch">
            <div className="flex flex-col gap-2 min-w-0 h-full">
              <GlassCard variant="emerald" className="flex-1 flex flex-col">
                <GlassCardBody className="flex-1 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/80 mb-3 flex items-center gap-2">
                    <Activity
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                      aria-hidden
                    />
                    Status
                  </p>
                  {/* self-start — flex-col parent would otherwise stretch inline-flex badge to w-full */}
                  <ProductStockStatusBadge
                    status={product?.status ?? "available"}
                    label={product?.status || "N/A"}
                    size="detail"
                    className="self-start text-sm w-fit"
                  />
                </GlassCardBody>
              </GlassCard>

              <GlassCard variant="amber" className="flex-1 flex flex-col">
                <GlassCardBody className="flex-1 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/80 mb-3 flex items-center gap-2">
                    <Layers
                      className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0"
                      aria-hidden
                    />
                    Stock
                  </p>
                  <p
                    className={cn(
                      "text-sm sm:text-base font-medium",
                      productStockAvailableTextClass(
                        (product?.quantity ?? 0) - displayCommitted,
                      ),
                    )}
                  >
                    {(product?.quantity ?? 0) - displayCommitted}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      available
                    </span>
                  </p>
                  {displayCommitted > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span>{displayCommitted} reserved</span>
                      <span className="mx-1">·</span>
                      {product?.quantity} total
                    </p>
                  )}
                </GlassCardBody>
              </GlassCard>

              <GlassCard variant="blue" className="flex-1 flex flex-col">
                <GlassCardBody className="flex-1 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/80 mb-3 flex items-center gap-2">
                    <DollarSign
                      className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0"
                      aria-hidden
                    />
                    Price
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    ${product?.price.toFixed(2)}
                  </p>
                </GlassCardBody>
              </GlassCard>
            </div>

            <GlassCard variant="sky" className="h-full flex flex-col">
              <GlassCardBody className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/30 bg-sky-100/50 dark:border-white/15 dark:bg-white/10">
                    <ImageIcon className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className={TYPO_CARD_TITLE}>Product Image</h3>
                </div>
                {product?.imageUrl ? (
                  <div className="relative w-full flex-1 min-h-64 rounded-xl overflow-hidden bg-white/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10">
                    <SafeImage
                      src={product?.imageUrl}
                      alt={product?.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="w-full flex-1 min-h-64 rounded-xl bg-white/30 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-white/80">
                      No image available
                    </p>
                  </div>
                )}
              </GlassCardBody>
            </GlassCard>

            <GlassCard variant="violet" className="h-full flex flex-col">
              <GlassCardBody className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
                    <QrCode className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className={TYPO_CARD_TITLE}>QR Code / Barcode</h3>
                </div>
                {product?.qrCodeUrl ? (
                  <div className="relative w-full flex-1 min-h-64 rounded-xl overflow-hidden bg-white border border-gray-300/20 dark:border-white/10">
                    <SafeImage
                      src={product?.qrCodeUrl}
                      alt={`QR Code for ${product?.sku}`}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="w-full flex-1 min-h-64 rounded-xl bg-white/30 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-white/80">
                      No QR code available
                    </p>
                  </div>
                )}
              </GlassCardBody>
            </GlassCard>
          </div>

          {/* Product Information and Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Product Information */}
            <GlassCard variant="teal">
              <GlassCardBody>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-100/50 dark:border-white/15 dark:bg-white/10">
                    <Package className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    Product Information
                  </h3>
                </div>
                <div className="space-y-2">
                  {!dataLoading && product && (
                    <DetailInfoRow
                      icon={Hash}
                      label="Product ID:"
                      tone="violet"
                    >
                      <CopyableText value={product.id}>
                        <span className="font-mono text-xs">{product.id}</span>
                      </CopyableText>
                    </DetailInfoRow>
                  )}
                  <DetailInfoRow
                    icon={Tag}
                    label="SKU:"
                    tone="teal"
                    loading={dataLoading}
                  >
                    {!dataLoading && product?.sku && (
                      <CopyableText value={product.sku}>
                        {product.sku}
                      </CopyableText>
                    )}
                  </DetailInfoRow>
                  {!dataLoading &&
                    product?.category &&
                    typeof product.category === "object" && (
                      <DetailInfoRow icon={Tag} label="Category:" tone="sky">
                        <Link
                          href={
                            embedInAdmin
                              ? `/admin/categories/${product.category.id}`
                              : `/categories/${product.category.id}`
                          }
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          {product.category.name}
                        </Link>
                      </DetailInfoRow>
                    )}
                  {!dataLoading &&
                    product?.supplier &&
                    typeof product.supplier === "object" && (
                      <DetailInfoRow
                        icon={Truck}
                        label="Supplier:"
                        tone="orange"
                      >
                        <PersonInlineRow
                          seed={product.supplier.id}
                          name={product.supplier.name}
                          email={
                            "email" in product.supplier
                              ? product.supplier.email
                              : undefined
                          }
                          href={
                            embedInAdmin
                              ? `/admin/suppliers/${product.supplier.id}`
                              : `/suppliers/${product.supplier.id}`
                          }
                        />
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
                    {!dataLoading && expirationDate && (
                      <DetailInfoRow
                        icon={Calendar}
                        label="Expiration:"
                        tone="amber"
                      >
                        <ClientDate
                          date={expirationDate}
                          semantic="expiration"
                        />
                      </DetailInfoRow>
                    )}
                  </DetailInfoRowGroup>
                  {!dataLoading && product && (
                    <DetailInfoRowGroup>
                      <DetailInfoRow
                        icon={Package}
                        label="Stock qty:"
                        tone="blue"
                        valueClassName="text-gray-700 dark:text-gray-300"
                      >
                        {product.quantity ?? 0}
                      </DetailInfoRow>
                      {displayCommitted > 0 && (
                        <DetailInfoRow
                          icon={Package}
                          label="Reserved:"
                          tone="violet"
                          valueClassName="text-amber-600 dark:text-amber-400"
                        >
                          {displayCommitted}
                        </DetailInfoRow>
                      )}
                      <DetailInfoRow
                        icon={Package}
                        label="Available:"
                        tone="emerald"
                        valueClassName={productStockAvailableTextClass(
                          (product.quantity ?? 0) - displayCommitted,
                        )}
                      >
                        {(product.quantity ?? 0) - displayCommitted}
                      </DetailInfoRow>
                    </DetailInfoRowGroup>
                  )}
                  {!dataLoading && product?.deletedAt && (
                    <DetailInfoRow icon={Package} label="Archived:" tone="rose">
                      <ClientDateTime
                        date={new Date(product.deletedAt)}
                        semantic="cancelled"
                      />
                    </DetailInfoRow>
                  )}
                  {!dataLoading && product?.creator && (
                    <AuditUserDetailRow
                      label="Created by:"
                      tone="violet"
                      user={product.creator}
                      href={ownerProductsHref(product.creator.id)}
                    />
                  )}
                  {!dataLoading && product?.updater && (
                    <AuditUserDetailRow
                      label="Updated by:"
                      tone="blue"
                      user={product.updater}
                      href={resolveAuditUserManagementHref(
                        product.updater.id,
                        isAdminRole,
                      )}
                    />
                  )}
                </div>
              </GlassCardBody>
            </GlassCard>

            {/* Sales Statistics */}
            <GlassCard variant="orange">
              <GlassCardBody>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/30 bg-orange-100/50 dark:border-white/15 dark:bg-white/10">
                    <BarChart3 className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className={TYPO_CARD_TITLE}>Sales Statistics</h3>
                    <p className={TYPO_SUBTITLE}>
                      Summary of sales and inventory data
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <DetailInfoRow
                    icon={Package}
                    label="Total Quantity Sold:"
                    tone="emerald"
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
                    label="Orders Containing This Product:"
                    tone="violet"
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

          {insights && (
            <CatalogInsightsSection
              insights={insights}
              dataLoading={dataLoading}
              isAdminRole={isAdminRole}
              forecastLoading={forecastLoading}
              title="Product Insights"
              subtitle="Sales velocity and stock signals for this SKU"
              salesChartTitle="Sales Trend (6 months)"
              salesChartDescription="Revenue from this product's order lines"
              stockChartTitle={
                insights.warehouseStock
                  ? "Warehouse Allocated Stock"
                  : "Stock Status"
              }
              stockChartDescription={
                insights.warehouseStock
                  ? "Available vs reserved across warehouses"
                  : "On-hand stock status"
              }
              stockChartTrailing={warehouseStockChartTrailing}
              salesChartData={salesChartData}
              stockChartData={stockChartData}
              stockPieColors={
                insights.warehouseStock ? WAREHOUSE_STOCK_PIE_COLORS : undefined
              }
              productForecast={productForecast}
              productHref={productHref}
              catalogQuantity={catalogQuantity}
              catalogAllocationSummary={allocationSummaryParts ?? undefined}
            />
          )}

          {showWarehouseStockCard && (
            <GlassCard variant="teal">
              <GlassCardBody>
                <SectionTitleRow
                  as="h3"
                  icon={Building2}
                  iconClassName="text-teal-600 dark:text-teal-400"
                  iconTile
                  title="Warehouse Stock"
                  trailing={
                    !warehouseStockLoading && product != null ? (
                      <>
                        {warehouseAllocations.length > 0 ? (
                          <SectionCountBadge>
                            {warehouseAllocations.length} warehouses
                          </SectionCountBadge>
                        ) : null}
                        {catalogAvailableQty != null ? (
                          <SectionCountBadge>
                            {catalogAvailableQty} catalog avail
                          </SectionCountBadge>
                        ) : null}
                        {warehouseAllocations.length > 0 ? (
                          <SectionCountBadge>
                            {totalWarehouseAvailable} in warehouses
                          </SectionCountBadge>
                        ) : null}
                      </>
                    ) : undefined
                  }
                  subtitle={
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3 w-full">
                      <span className="shrink-0">
                        Allocated per warehouse; unallocated qty stays on
                        catalog total
                      </span>
                      {allocationSummaryParts ? (
                        <CatalogAllocationSummaryText
                          catalogQty={allocationSummaryParts.catalogQty}
                          allocatedTotal={allocationSummaryParts.allocatedTotal}
                          unallocated={allocationSummaryParts.unallocated}
                          reservedCommitment={
                            allocationSummaryParts.reservedCommitment
                          }
                          className="sm:text-right sm:justify-end"
                        />
                      ) : null}
                    </div>
                  }
                />
                {warehouseStockLoading ? (
                  <DataSlotPulse variant="text-sm" className="mt-4 h-16" />
                ) : warehouseAllocations.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    {warehouseAllocations.map((row) => {
                      const avail = row.quantity - row.reservedQuantity;
                      const catalogOnlyCommit =
                        displayCommitted > Number(row.reservedQuantity ?? 0);
                      const commitHint = catalogOnlyCommit
                        ? formatCatalogCommitWarehouseHint(displayCommitted)
                        : "";
                      const whHref = embedInAdmin
                        ? `/admin/warehouses/${row.warehouseId}`
                        : `/warehouses/${row.warehouseId}`;
                      const WhIcon = getWarehouseTypeIcon(row.warehouse?.type);
                      return (
                        <div
                          key={row.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-teal-200/30 dark:border-teal-400/10 bg-gradient-to-r from-teal-100/40 via-teal-50/20 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-xl border border-teal-400/30 bg-teal-500/20 shrink-0">
                              <WhIcon
                                className="h-5 w-5 text-teal-600 dark:text-teal-400"
                                aria-hidden
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                {warehouseLinkAllowed ? (
                                  <Link
                                    href={whHref}
                                    className="font-normal text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500"
                                  >
                                    {row.warehouse?.name ?? "Warehouse"}
                                  </Link>
                                ) : (
                                  <span className="font-normal text-sm text-gray-700 dark:text-white">
                                    {row.warehouse?.name ?? "Warehouse"}
                                  </span>
                                )}
                                {row.warehouse?.status != null && (
                                  <ActiveInactiveBadge
                                    active={row.warehouse.status}
                                    size="detail"
                                  />
                                )}
                                {row.warehouse?.type ? (
                                  <WarehouseTypeBadge
                                    type={row.warehouse.type}
                                    size="detail"
                                  />
                                ) : null}
                              </div>
                              {row.warehouse?.address ? (
                                <p
                                  className={cn(
                                    "text-xs flex items-start gap-1 min-w-0",
                                    TYPO_BODY_MUTED,
                                  )}
                                >
                                  <MapPin
                                    className="h-3.5 w-3.5 shrink-0 mt-0.5"
                                    aria-hidden
                                  />
                                  <span className="min-w-0 break-words">
                                    {row.warehouse.address}
                                  </span>
                                </p>
                              ) : null}
                              {commitHint ? (
                                <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
                                  {commitHint}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                productStockAvailableTextClass(avail),
                              )}
                            >
                              {avail}{" "}
                              <span className="font-normal text-gray-500 dark:text-gray-300">
                                available
                              </span>
                            </span>
                            {row.reservedQuantity > 0 ? (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                {row.reservedQuantity} reserved
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={CARD_EMPTY_MESSAGE_CLASS}>
                    No warehouse allocations for this product yet.
                  </p>
                )}
              </GlassCardBody>
            </GlassCard>
          )}

          {/* Recent Orders — always show card; empty state centered (REQ-0077) */}
          <GlassCard variant="rose">
            <GlassCardBody>
              <SectionTitleRow
                as="h3"
                icon={ShoppingCart}
                iconClassName="text-rose-600 dark:text-rose-400"
                iconTile
                title="Recent Orders"
                count={
                  !dataLoading && recentOrderCount > 0
                    ? recentOrderCount
                    : undefined
                }
                subtitle="Latest orders containing this product"
              />
              <CatalogDetailRecentOrdersList
                loading={dataLoading}
                orders={catalogRecentOrders}
                hideProductMeta
                emptyMessage="No recent orders for this product yet."
                orderHref={orderHref}
                productHref={productHref}
                ownerProductsHref={ownerProductsHref}
                categoryHref={categoryHref}
                invoiceHref={invoiceHref}
                isAdminRole={isAdminRole}
              />
            </GlassCardBody>
          </GlassCard>

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
              onClick={handleBack}
              className={glassDetailBackButtonClass("w-full sm:w-auto gap-2")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleEditProduct}
              disabled={disableCrud}
              className={glassDetailFooterButtonClass("blue")}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Product
            </Button>
            <Button
              onClick={handleDuplicateProduct}
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
              label="Delete Product"
              icon={Trash2}
              hue="rose"
              disabled={disableCrud}
              className="w-full sm:w-auto gap-2"
            />
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
