/**
 * Supplier Detail Page
 * Displays detailed information about a single supplier
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  DollarSign,
  BarChart3,
  ShoppingCart,
  User,
  Mail,
  FileText,
  Edit,
  Copy,
  Trash2,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActiveInactiveBadge,
  OrderStatusBadge,
} from "@/lib/ui/semantic-badges";
import { Separator } from "@/components/ui/separator";
import {
  useSupplier,
  useCreateSupplier,
  useDeleteSupplier,
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
  GLASS_GHOST_BUTTON,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  AvatarInlineLink,
} from "@/components/shared";
import { DetailInfoRow } from "@/components/orders/detail";
import SupplierDialog from "@/components/supplier/SupplierDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import type { Supplier } from "@/types";
import { SafeImage } from "@/components/ui/safe-image";
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

export type SupplierDetailPageProps = {
  embedInAdmin?: boolean;
  initialSupplier?: Supplier;
};

export default function SupplierDetailPage({
  embedInAdmin,
  initialSupplier,
}: SupplierDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { handleBack } = useBackWithRefresh("supplier");
  const supplierId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  // Fetch supplier details
  const supplierQuery = useSupplier(supplierId, initialSupplier);
  const supplier = supplierQuery.data;
  const dataLoading = isDataSlotLoading(supplierQuery, initialSupplier);

  useSyncSsrQueryData(queryKeys.suppliers.detail(supplierId), initialSupplier);

  const createSupplierMutation = useCreateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCopying = createSupplierMutation.isPending;
  const isDeleting = deleteSupplierMutation.isPending;
  const isGlobalDemo = Boolean(supplier?.isGlobalDemo);
  const isClientRole = user?.role === "client";
  const isSupplierRole = user?.role === "supplier";
  const disableCrud = isClientRole || isSupplierRole;

  const ownerProductsHref = (ownerId: string) =>
    embedInAdmin
      ? `/admin/products?ownerId=${ownerId}`
      : `/products?ownerId=${ownerId}`;

  // Edit: open supplier dialog with current supplier (same as SupplierActions via onEdit)
  const handleEditSupplier = () => {
    if (!supplier) return;
    setEditingSupplier(supplier as Supplier);
    setEditDialogOpen(true);
  };

  // Duplicate: create a copy (same as SupplierActions, use mutate + callbacks to avoid unhandled rejection)
  const handleDuplicateSupplier = () => {
    if (!supplier || !user?.id) return;
    createSupplierMutation.mutate({
      name: `${supplier?.name} (copy)`,
      userId: user.id,
      status: supplier?.status ?? true,
      description: supplier?.description ?? undefined,
      notes: supplier?.notes ?? undefined,
    });
  };

  // Delete: confirm then delete (same pattern as ProductActions / SupplierActions)
  const handleConfirmDeleteSupplier = () => {
    if (!supplier) return;
    deleteSupplierMutation.mutate(supplier?.id, {
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
  if (supplierQuery.isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <div className="text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Supplier Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {supplierQuery.error instanceof Error
                ? supplierQuery.error.message
                : "Failed to load supplier details"}
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

  // Format dates
  const createdAt = supplier?.createdAt
    ? new Date(supplier?.createdAt)
    : new Date();
  const updatedAt = supplier?.updatedAt ? new Date(supplier?.updatedAt) : null;

  // Supplier statistics
  const stats = supplier?.statistics || {
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
          {/* Header */}
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            tone="teal"
            icon={Truck}
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
            title={supplier?.name}
            description={
              <ClientRelativeTime date={createdAt} prefix="Created " />
            }
          />

          {/* Supplier Status Card */}
          <GlassCard variant="emerald">
            <div className="p-2 sm:p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-3">
                Status
              </p>
              <ActiveInactiveBadge
                active={Boolean(supplier?.status)}
                className="text-sm"
              />
            </div>
          </GlassCard>

          {/* Supplier Information and Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Supplier Information */}
            <GlassCard variant="orange">
              <div className="p-2 sm:p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/30 bg-orange-100/50 dark:border-white/15 dark:bg-white/10">
                    <Truck className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    Supplier Information
                  </h3>
                </div>
                <div className="space-y-2">
                  {!dataLoading && supplier && (
                    <DetailInfoRow
                      icon={Hash}
                      label="Supplier ID:"
                      tone="violet"
                    >
                      <CopyableText value={supplier.id}>
                        <span className="font-mono text-xs">{supplier.id}</span>
                      </CopyableText>
                    </DetailInfoRow>
                  )}
                  <DetailInfoRow
                    icon={Truck}
                    label="Name:"
                    tone="orange"
                    loading={dataLoading}
                  >
                    {!dataLoading && supplier?.name && (
                      <CopyableText value={supplier.name}>
                        {supplier.name}
                      </CopyableText>
                    )}
                  </DetailInfoRow>
                  {!dataLoading && supplier && (
                    <DetailInfoRow icon={Truck} label="Status:" tone="emerald">
                      <ActiveInactiveBadge active={Boolean(supplier.status)} />
                    </DetailInfoRow>
                  )}
                  {!dataLoading && supplier?.description && (
                    <div className="p-2 rounded-xl bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border border-amber-200/30 dark:border-amber-400/10">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Description:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-white">
                        {supplier.description}
                      </p>
                    </div>
                  )}
                  {!dataLoading && supplier?.notes && (
                    <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-100/50 via-yellow-50/30 to-transparent dark:from-yellow-500/10 dark:via-yellow-500/5 dark:to-transparent border border-yellow-200/30 dark:border-yellow-400/10">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Notes:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-white">
                        {supplier.notes}
                      </p>
                    </div>
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
                  {!dataLoading && supplier?.creator && (
                    <>
                      <DetailInfoRow
                        icon={User}
                        label="Created by:"
                        tone="violet"
                      >
                        <AvatarInlineLink
                          seed={supplier.creator.id}
                          image={supplier.creator.image}
                          label={
                            supplier.creator.name ?? supplier.creator.email
                          }
                          href={ownerProductsHref(supplier.creator.id)}
                        />
                      </DetailInfoRow>
                      <DetailInfoRow
                        icon={Mail}
                        label="Creator email:"
                        tone="violet"
                      >
                        <CopyableText value={supplier.creator.email}>
                          {supplier.creator.email}
                        </CopyableText>
                      </DetailInfoRow>
                    </>
                  )}
                  {!dataLoading && supplier?.updater && (
                    <>
                      <DetailInfoRow
                        icon={User}
                        label="Updated by:"
                        tone="blue"
                      >
                        {supplier.updater.name}
                      </DetailInfoRow>
                      <DetailInfoRow
                        icon={Mail}
                        label="Updater email:"
                        tone="blue"
                      >
                        {supplier.updater.email}
                      </DetailInfoRow>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Statistics */}
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
                  <div className="flex justify-between items-center p-2 rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Total Products:
                    </span>
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      {stats.totalProducts}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Total Quantity Sold:
                    </span>
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      {stats.totalQuantitySold}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Total Revenue:
                    </span>
                    <span className="text-sm sm:text-lg font-medium text-emerald-600 dark:text-emerald-400">
                      ${stats.totalRevenue.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Orders Containing Products:
                    </span>
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      {stats.uniqueOrders}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <span className="text-sm text-gray-600 dark:text-white/70">
                      Current Stock Value:
                    </span>
                    <span className="text-sm sm:text-lg font-medium text-blue-600 dark:text-blue-400">
                      ${stats.totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Products from this Supplier */}
          {supplier?.products && supplier?.products.length > 0 && (
            <GlassCard variant="sky">
              <div className="p-2 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/30 bg-sky-100/50 dark:border-white/15 dark:bg-white/10">
                    <Package className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Products from this Supplier
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      {supplier?.products.length} product
                      {supplier?.products.length !== 1 ? "s" : ""} supplied
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                  {supplier?.products.map((product) => (
                    <Link
                      key={product.id}
                      href={
                        embedInAdmin
                          ? `/admin/products/${product.id}`
                          : `/products/${product.id}`
                      }
                      className="flex items-center gap-2 p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 backdrop-blur-md transition-colors"
                    >
                      {/* REQ-0059: Package-icon fallback so rows without image stay aligned */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                          <SafeImage
                            src={product.imageUrl}
                            width={64}
                            height={64}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package
                            className="h-6 w-6 text-gray-400 dark:text-gray-500"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-white/60">
                          SKU: {product.sku}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-white/60">
                          Stock: {product.quantity} • $
                          {(product.price ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Recent Orders */}
          {supplier?.recentOrders && supplier?.recentOrders.length > 0 && (
            <GlassCard variant="violet">
              <div className="p-2 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
                    <ShoppingCart className="h-4 w-4 text-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Recent Orders
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Latest orders containing products from this supplier
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {supplier?.recentOrders.map((order) => (
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
                          <CopyableText value={order.orderNumber}>
                            Order {order.orderNumber}
                          </CopyableText>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                          Product: {order.productName} (SKU: {order.productSku})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-white/60">
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
              onClick={handleEditSupplier}
              disabled={disableCrud || isGlobalDemo}
              className={glassDetailFooterButtonClass("blue")}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Supplier
            </Button>
            <Button
              onClick={handleDuplicateSupplier}
              disabled={isCopying || disableCrud || isGlobalDemo}
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
              label="Delete Supplier"
              icon={Trash2}
              hue="rose"
              disabled={disableCrud || isGlobalDemo}
              className="w-full sm:w-auto gap-2"
            />
          </div>

          {/* Delete confirmation — same pattern as SupplierActions */}
          <AlertDialogWrapper
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Are you absolutely sure?"
            description={`This action cannot be undone. This will permanently delete the supplier "${supplier?.name}".`}
            actionLabel="Delete"
            actionLoadingLabel="Deleting..."
            isLoading={isDeleting}
            onAction={handleConfirmDeleteSupplier}
            onCancel={() => setDeleteDialogOpen(false)}
            actionVariant="destructive"
          />

          {/* Edit dialog — opened by "Edit Supplier"; toasts from mutation hooks */}
          <SupplierDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setEditingSupplier(null);
            }}
            editingSupplier={editingSupplier}
            onEditSupplier={(s) => setEditingSupplier(s)}
          >
            <div style={{ display: "none" }} aria-hidden />
          </SupplierDialog>
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
