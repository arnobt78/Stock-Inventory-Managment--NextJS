/**
 * Order Detail Page
 * Displays detailed information about a single order
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Truck,
  Edit,
  Trash2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder, useDeleteOrder } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { queryKeys, invalidateAfterOrderGraphChange } from "@/lib/react-query";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  ClientRelativeTime,
  PageContentWrapper,
  DataSlotPulse,
} from "@/components/shared";
import type { OrderStatus, PaymentStatus } from "@/types";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import OrderDialog from "@/components/orders/OrderDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import { PaymentDialog } from "@/components/payments";
import { OrderTrackingInfo, ShippingManagement } from "@/components/shipping";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/**
 * Order status badge classes — same distinct colors as supplier dashboard (readable, not red)
 * Pending = unpaid/awaiting; Confirmed = paid; Cancelled = red; etc.
 */
function getStatusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300/40";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300/40";
    case "processing":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border border-violet-300/40";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border border-indigo-300/40";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300/40";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-300/40";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border border-gray-300/40";
  }
}

/**
 * Payment status badge classes — distinct from order status (Paid = green, Unpaid = gray, etc.)
 */
function getPaymentStatusBadgeClasses(status: PaymentStatus): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300/40";
    case "partial":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300/40";
    case "unpaid":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200 border border-gray-300/40";
    case "refunded":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-300/40";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200 border border-gray-300/40";
  }
}

/**
 * Format address for display
 */
function formatAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "N/A";
  const addr = address as Record<string, unknown>;
  const parts: string[] = [];
  if (addr.street) parts.push(String(addr.street));
  if (addr.city) parts.push(String(addr.city));
  if (addr.state) parts.push(String(addr.state));
  if (addr.zipCode) parts.push(String(addr.zipCode));
  if (addr.country) parts.push(String(addr.country));
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { handleBack } = useBackWithRefresh("order");
  const orderId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch order details
  const { data: order, isLoading, isError, error } = useOrder(orderId);

  // When returning from Stripe (payment=success or payment=cancelled), refetch order so UI shows Paid / correct state without manual refresh.
  // The webhook updates order/invoice asynchronously, so we poll a few times to catch the update.
  // NOTE: searchParams omitted from deps - router.replace clears it, which would re-run effect and cancel polling.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (
      !orderId ||
      !payment ||
      (payment !== "success" && payment !== "cancelled")
    )
      return;

    const detailKey = queryKeys.orders.detail(orderId);
    // Refetch order detail + product/category pages that embed order status (recentOrders)
    invalidateAfterOrderGraphChange(queryClient);
    queryClient.refetchQueries({ queryKey: detailKey });

    // Poll: webhook may not have run yet when user lands. Retry at 0.5s, 1.5s, 3s, 5s, 8s
    const runInvalidations = () => {
      invalidateAfterOrderGraphChange(queryClient);
      queryClient.refetchQueries({ queryKey: detailKey });
    };
    const delays = [500, 1500, 3000, 5000, 8000];
    const timeouts = delays.map((delay) => setTimeout(runInvalidations, delay));

    // Clean URL after a short delay so we don't re-trigger effect and cancel polling
    const cleanupUrlTimer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("payment");
      next.delete("session_id");
      const path =
        window.location.pathname +
        (next.toString() ? `?${next.toString()}` : "");
      router.replace(path, { scroll: false });
    }, 1500);

    return () => {
      clearTimeout(cleanupUrlTimer);
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [orderId, queryClient, router]);
  const deleteOrderMutation = useDeleteOrder();
  const isCancelling = deleteOrderMutation.isPending;
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const disableOrderActions = isSupplierRole || isClientRole;

  // Edit/Update Order: open OrderDialog in edit mode (same as OrderList/OrderActions)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleUpdateOrder = useCallback(() => {
    if (!order) return;
    setEditingOrder(order);
    setEditDialogOpen(true);
  }, [order]);

  const handleConfirmCancelOrder = useCallback(() => {
    if (!order) return;
    deleteOrderMutation.mutate(order.id, {
      onSuccess: () => {
        setCancelDialogOpen(false);
        router.refresh();
      },
      onError: () => {
        setCancelDialogOpen(false);
      },
    });
  }, [order, deleteOrderMutation, router]);

  // Mark component as mounted after client-side hydration
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  // Determine loading state - prevents hydration mismatch
  const showSkeleton = !isMounted || isCheckingAuth || isLoading;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push("/login");
    }
  }, [user, isCheckingAuth, router]);

  // Show error state
  if (isError) {
    return (
      <Navbar>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error instanceof Error
                ? error.message
                : "Failed to load order details"}
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
      </Navbar>
    );
  }

  // Show loading skeleton
  if (showSkeleton || !order) {
    return (
      <Navbar>
        <PageContentWrapper>
          <div className="max-w-9xl mx-auto space-y-4">
            {/* Header Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-300/30 dark:border-white/10 animate-pulse" />
              <div className="flex-1">
                <div className="h-8 w-48 bg-white/50 dark:bg-white/5 rounded-lg border border-gray-300/30 dark:border-white/10 animate-pulse" />
                <div className="h-4 w-32 mt-2 bg-white/50 dark:bg-white/5 rounded-lg border border-gray-300/30 dark:border-white/10 animate-pulse" />
              </div>
            </div>

            {/* Status Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <GlassCard variant="amber" className="animate-pulse">
                <div className="h-4 w-24 bg-white/50 dark:bg-white/10 rounded mb-3" />
                <div className="h-6 w-20 bg-white/50 dark:bg-white/10 rounded-full" />
              </GlassCard>
              <GlassCard variant="emerald" className="animate-pulse">
                <div className="h-4 w-28 bg-white/50 dark:bg-white/10 rounded mb-3" />
                <div className="h-6 w-16 bg-white/50 dark:bg-white/10 rounded-full" />
              </GlassCard>
            </div>

            {/* Order Items Skeleton */}
            <GlassCard variant="sky" className="animate-pulse">
              <div className="h-6 w-32 bg-white/50 dark:bg-white/10 rounded mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-full bg-white/50 dark:bg-white/10 rounded-xl"
                  />
                ))}
              </div>
            </GlassCard>

            {/* Order Information and Summary Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
              <GlassCard variant="orange" className="animate-pulse">
                <div className="h-6 w-40 bg-white/50 dark:bg-white/10 rounded mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-4 w-full bg-white/50 dark:bg-white/10 rounded"
                    />
                  ))}
                </div>
              </GlassCard>

              <div className="space-y-4">
                <GlassCard variant="violet" className="animate-pulse">
                  <div className="h-6 w-36 bg-white/50 dark:bg-white/10 rounded mb-4" />
                  <div className="h-4 w-full bg-white/50 dark:bg-white/10 rounded" />
                </GlassCard>
                <GlassCard variant="teal" className="animate-pulse">
                  <div className="h-6 w-32 bg-white/50 dark:bg-white/10 rounded mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-20 bg-white/50 dark:bg-white/10 rounded" />
                        <div className="h-4 w-16 bg-white/50 dark:bg-white/10 rounded" />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-full sm:w-36 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-300/30 dark:border-white/10 animate-pulse"
                />
              ))}
            </div>
          </div>
        </PageContentWrapper>
      </Navbar>
    );
  }

  // Format dates
  const createdAt = new Date(order.createdAt);
  const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
  const shippedAt = order.shippedAt ? new Date(order.shippedAt) : null;
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const estimatedDelivery = order.estimatedDelivery
    ? new Date(order.estimatedDelivery)
    : null;

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="max-w-9xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                Order {order.orderNumber}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <ClientRelativeTime date={createdAt} prefix="Created " />
              </p>
            </div>
          </div>

          {/* Order Status + Payment Status (left) | Shipping Information (right when present) — glassmorphic */}
          {(() => {
            const hasShipping = !!(
              order.trackingNumber &&
              (order.status === "shipped" || order.status === "delivered")
            );
            return (
              <div
                className={cn(
                  "grid gap-2",
                  hasShipping
                    ? "grid-cols-1 lg:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2",
                )}
              >
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-2",
                    hasShipping && "lg:col-span-2",
                  )}
                >
                  <GlassCard variant="amber">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
                      Order Status
                    </p>
                    <Badge
                      className={cn(
                        "text-sm px-3 py-1.5 rounded-full backdrop-blur-sm font-medium",
                        getStatusBadgeClasses(order.status),
                      )}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </GlassCard>
                  <GlassCard variant="emerald">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
                      Payment Status
                    </p>
                    <Badge
                      className={cn(
                        "text-sm px-3 py-1.5 rounded-full backdrop-blur-sm font-medium",
                        getPaymentStatusBadgeClasses(order.paymentStatus),
                      )}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() +
                        order.paymentStatus.slice(1)}
                    </Badge>
                  </GlassCard>
                </div>
                {hasShipping && (
                  <div className="lg:col-span-1 min-w-0">
                    <OrderTrackingInfo order={order} />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Order Items */}
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
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                  Order Items
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}{" "}
                  in this order
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-700 dark:text-white">
                      {item.productName}
                    </h4>
                    {item.sku && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right mt-2 sm:mt-0 flex flex-col items-end gap-2">
                    <p className="font-semibold text-sky-600 dark:text-sky-400 text-lg">
                      ${item.subtotal.toFixed(2)}
                    </p>
                    {order.paymentStatus === "paid" && (
                      <ProductReviewsSection
                        productId={item.productId}
                        productName={item.productName}
                        orderId={order.id}
                        compact
                        variant="sky"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Order Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Order Information */}
            <GlassCard variant="orange">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.orange.iconBg,
                    "dark:border-orange-400/30 dark:bg-orange-500/20",
                  )}
                >
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                  Order Information
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-orange-100/50 via-orange-50/30 to-transparent dark:from-orange-500/10 dark:via-orange-500/5 dark:to-transparent border border-orange-200/30 dark:border-orange-400/10">
                  <Calendar className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    <ClientDateTime date={createdAt} />
                  </span>
                </div>
                {updatedAt && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border border-amber-200/30 dark:border-amber-400/10">
                    <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Updated:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientDateTime date={updatedAt} />
                    </span>
                  </div>
                )}
                {shippedAt && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-sky-100/50 via-sky-50/30 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent border border-sky-200/30 dark:border-sky-400/10">
                    <Truck className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipped:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientDateTime date={shippedAt} />
                    </span>
                  </div>
                )}
                {deliveredAt && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/10">
                    <Package className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivered:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientDateTime date={deliveredAt} />
                    </span>
                  </div>
                )}
                {estimatedDelivery && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-violet-100/50 via-violet-50/30 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10">
                    <Calendar className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Estimated Delivery:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      <ClientDate date={estimatedDelivery} />
                    </span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                    <Truck className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Tracking:
                    </span>
                    {order.trackingUrl ? (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      >
                        {order.trackingNumber}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-700 dark:text-white">
                        {order.trackingNumber}
                      </span>
                    )}
                  </div>
                )}
                {order.notes && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Parties & roles */}
            {(order.placedByName != null ||
              order.placedByEmail != null ||
              (order.orderProductOwners &&
                order.orderProductOwners.length > 0)) && (
              <GlassCard variant="teal">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={cn(
                      "p-2 rounded-xl border",
                      variantConfig.teal.iconBg,
                      "dark:border-teal-400/30 dark:bg-teal-500/20",
                    )}
                  >
                    <Package className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                    Parties &amp; roles
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                      Ordered by
                    </p>
                    <p className="text-gray-700 dark:text-white">
                      {order.placedByName ?? "—"}
                      {order.placedByEmail && (
                        <span className="text-gray-600 dark:text-gray-400 block text-xs">
                          {order.placedByEmail}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                      Customer / Ship to
                    </p>
                    <p className="text-gray-700 dark:text-white">
                      {(order.shippingAddress as { name?: string })?.name ??
                        order.placedByName ??
                        "—"}
                      {((order.shippingAddress as { email?: string })?.email ??
                        order.placedByEmail) && (
                        <span className="text-gray-600 dark:text-gray-400 block text-xs">
                          {(order.shippingAddress as { email?: string })
                            ?.email ?? order.placedByEmail}
                        </span>
                      )}
                    </p>
                  </div>
                  {order.orderProductOwners &&
                    order.orderProductOwners.length > 0 && (
                      <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                          Product owner(s)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.orderProductOwners.map((owner) => (
                            <span
                              key={owner.userId}
                              className="inline-flex items-center gap-1 rounded-md bg-white/50 dark:bg-white/10 px-2 py-1 text-xs border border-teal-200/30 dark:border-teal-400/20"
                            >
                              {owner.name ?? owner.email}
                              {owner.name && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  ({owner.email})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </GlassCard>
            )}

            {/* Addresses & Totals */}
            <div className="space-y-4">
              {/* Shipping Address */}
              {order.shippingAddress && (
                <GlassCard variant="violet">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl border",
                        variantConfig.violet.iconBg,
                        "dark:border-violet-400/30 dark:bg-violet-500/20",
                      )}
                    >
                      <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                      Shipping Address
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10">
                    {formatAddress(order.shippingAddress)}
                  </p>
                </GlassCard>
              )}

              {/* Billing Address */}
              {order.billingAddress && (
                <GlassCard variant="blue">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl border",
                        variantConfig.blue.iconBg,
                        "dark:border-blue-400/30 dark:bg-blue-500/20",
                      )}
                    >
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                      Billing Address
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-blue-100/40 via-blue-50/20 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                    {formatAddress(order.billingAddress)}
                  </p>
                </GlassCard>
              )}

              {/* Order Totals */}
              <GlassCard variant="teal">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={cn(
                      "p-2 rounded-xl border",
                      variantConfig.teal.iconBg,
                      "dark:border-teal-400/30 dark:bg-teal-500/20",
                    )}
                  >
                    <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                    Order Summary
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      ${order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {order.tax && order.tax > 0 && (
                    <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-amber-100/40 via-amber-50/20 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tax:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        ${order.tax.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.shipping && order.shipping > 0 && (
                    <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent">
                      <span className="text-gray-600 dark:text-gray-400">
                        Shipping:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        ${order.shipping.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-rose-100/40 via-rose-50/20 to-transparent dark:from-rose-500/10 dark:via-rose-500/5 dark:to-transparent">
                      <span className="text-gray-600 dark:text-gray-400">
                        Discount:
                      </span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        -${order.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
                  <div className="flex justify-between text-lg font-semibold p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/20">
                    <span className="text-gray-700 dark:text-white">
                      Total:
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Actions — Back, Update Order, Pay, Cancel Order */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto gap-2 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    onClick={handleUpdateOrder}
                    disabled={disableOrderActions}
                    className="w-full sm:w-auto gap-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30 text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)] backdrop-blur-sm hover:border-blue-300/50 hover:from-blue-500/80 hover:via-blue-500/60 hover:to-blue-500/40 transition-all duration-300 disabled:opacity-50"
                  >
                    <Edit className="h-4 w-4 shrink-0" />
                    Update Order
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {disableOrderActions
                  ? "Only the admin who owns the order can update it."
                  : "Edit order details."}
              </TooltipContent>
            </Tooltip>
            {order.paymentStatus !== "paid" && order.status !== "cancelled" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <PaymentDialog
                      type="order"
                      id={order.id}
                      referenceNumber={order.orderNumber}
                      amount={order.total}
                      items={order.items.map((item) => ({
                        name: item.productName,
                        quantity: item.quantity,
                        price: item.subtotal,
                      }))}
                      tax={order.tax ?? undefined}
                      shipping={order.shipping ?? undefined}
                      discount={order.discount ?? undefined}
                      disabled={isSupplierRole}
                      trigger={
                        <Button
                          disabled={isSupplierRole}
                          className="w-full sm:w-auto gap-2 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] backdrop-blur-sm hover:border-emerald-300/50 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40 transition-all duration-300 disabled:opacity-50"
                        >
                          <CreditCard className="h-4 w-4 shrink-0" />
                          Pay ${order.total.toFixed(2)}
                        </Button>
                      }
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {isSupplierRole
                    ? "Only the order creator or client can complete payment."
                    : "Complete payment for this order via Stripe."}
                </TooltipContent>
              </Tooltip>
            )}
            {order.status !== "cancelled" &&
              order.status !== "shipped" &&
              order.status !== "delivered" &&
              !order.trackingNumber && (
                <ShippingManagement
                  order={order}
                  disabled={disableOrderActions}
                  trigger={
                    <Button
                      disabled={disableOrderActions}
                      className="w-full sm:w-auto gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 text-white shadow-[0_10px_25px_rgba(139,92,246,0.35)] backdrop-blur-sm hover:border-violet-300/50 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 transition-all duration-300 disabled:opacity-50"
                    >
                      <Truck className="h-4 w-4 shrink-0" />
                      Ship Order
                    </Button>
                  }
                />
              )}
            {order.status !== "cancelled" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={isCancelling || disableOrderActions}
                      className="w-full sm:w-auto gap-2 rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 text-white shadow-[0_10px_25px_rgba(225,29,72,0.35)] backdrop-blur-sm hover:border-rose-300/50 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 transition-all duration-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      {isCancelling ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {disableOrderActions
                    ? "Only the admin who owns the order can cancel it."
                    : "Cancel this order."}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Cancel Order confirmation — same pattern as OrderActions */}
          <AlertDialogWrapper
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            title="Cancel Order"
            description={`Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`}
            actionLabel="Cancel Order"
            actionLoadingLabel="Cancelling..."
            isLoading={isCancelling}
            onAction={handleConfirmCancelOrder}
            onCancel={() => setCancelDialogOpen(false)}
          />

          {/* Update Order dialog — opened by "Update Order" / "Edit Order"; controlled as in OrderList */}
          <OrderDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditingOrder(null);
              }
            }}
            editingOrder={editingOrder}
            onEditOrder={(order) => {
              setEditingOrder(order ?? null);
            }}
          >
            <div style={{ display: "none" }} aria-hidden />
          </OrderDialog>
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
