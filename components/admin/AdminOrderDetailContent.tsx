"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Truck,
} from "lucide-react";
import { useOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/queries";
import {
  ClientDateTime,
  ClientRelativeTime,
  DeferredSelectGate,
  PageContentWrapper,
} from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus, PaymentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { OrderTrackingInfo, ShippingManagement } from "@/components/shipping";
import ProductReviewsSection from "@/components/product-reviews/ProductReviewsSection";

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const CARRIERS = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
];

type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "rose";

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
  rose: {
    border: "border-rose-400/20",
    gradient:
      "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(225,29,72,0.15)] dark:shadow-[0_15px_40px_rgba(225,29,72,0.1)]",
    hoverBorder: "hover:border-rose-300/40",
    iconBg: "border-rose-300/30 bg-rose-100/50",
  },
};

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

function getCustomerDisplay(order: {
  shippingAddress?: unknown;
  placedByName?: string | null;
}): string {
  const addr = order.shippingAddress as
    | { name?: string; email?: string }
    | null
    | undefined;
  if (addr?.name) return addr.name;
  if (addr?.email) return addr.email;
  if (order.placedByName) return order.placedByName;
  return "—";
}

function getCustomerEmail(order: {
  shippingAddress?: unknown;
  placedByEmail?: string | null;
}): string {
  const addr = order.shippingAddress as { email?: string } | null | undefined;
  if (addr?.email) return addr.email;
  if (order.placedByEmail) return order.placedByEmail;
  return "—";
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "shipped":
    case "delivered":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export type AdminOrderDetailContentProps = {
  /** Back link target (e.g. "/admin/personal-orders" or "/admin/client-orders") */
  backHref?: string;
};

/**
 * Admin Order Detail — view and manage a single order.
 * Status dropdown, Shipping & Tracking (display + manual add), Refund (mark payment as refunded).
 * Matches codebook-ecommerce AdminOrderDetailPage workflow.
 */
export default function AdminOrderDetailContent({
  backHref = "/admin/personal-orders",
}: AdminOrderDetailContentProps = {}) {
  const params = useParams();
  const orderId = params?.id as string;
  const { toast } = useToast();
  const { data: order, isLoading, isError, error } = useOrder(orderId);
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  const [manualTrackingNumber, setManualTrackingNumber] = useState("");
  const [manualCarrier, setManualCarrier] = useState("usps");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const handleStatusChange = useCallback(
    (newStatus: OrderStatus) => {
      if (!orderId || newStatus === order?.status) return;
      updateOrderMutation.mutate(
        { id: orderId, data: { status: newStatus } },
        {
          onSuccess: () => {
            toast({
              title: "Status updated",
              description: `Order status set to ${newStatus}.`,
            });
          },
          onError: (err) => {
            toast({
              title: "Update failed",
              description:
                err instanceof Error ? err.message : "Failed to update status.",
              variant: "destructive",
            });
          },
        },
      );
    },
    [orderId, order?.status, updateOrderMutation, toast],
  );

  const handleAddTracking = useCallback(() => {
    if (!orderId || !manualTrackingNumber.trim()) {
      toast({
        title: "Tracking required",
        description: "Please enter a tracking number.",
        variant: "destructive",
      });
      return;
    }
    updateOrderMutation.mutate(
      {
        id: orderId,
        data: {
          trackingNumber: manualTrackingNumber.trim(),
          trackingUrl: undefined,
          status: "shipped",
          shippedAt: new Date(),
        },
      },
      {
        onSuccess: () => {
          setManualTrackingNumber("");
          setManualCarrier("usps");
          toast({
            title: "Tracking added",
            description: "Order status set to shipped.",
          });
        },
        onError: (err) => {
          toast({
            title: "Update failed",
            description:
              err instanceof Error ? err.message : "Failed to add tracking.",
            variant: "destructive",
          });
        },
      },
    );
  }, [orderId, manualTrackingNumber, updateOrderMutation, toast]);

  const handleRefund = useCallback(() => {
    if (!orderId) return;
    // Use Cancel API for full revert: Stripe refund + status cancelled + stock restored + invoice cancelled
    deleteOrderMutation.mutate(orderId, {
      onSuccess: () => {
        setRefundDialogOpen(false);
        toast({
          title: "Order refunded and cancelled",
          description:
            "Stripe refund issued, stock restored, and all related data updated.",
        });
      },
      onError: (err) => {
        toast({
          title: "Refund failed",
          description:
            err instanceof Error ? err.message : "Failed to process refund.",
          variant: "destructive",
        });
      },
    });
  }, [orderId, deleteOrderMutation, toast]);

  const canRefund = order && order.paymentStatus === "paid";

  if (isError || (!isLoading && !order)) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div className="rounded-[20px] border border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 text-center">
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Order not found"}
            </p>
          </div>
        </div>
      </PageContentWrapper>
    );
  }

  if (isLoading || !order) {
    return (
      <PageContentWrapper>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContentWrapper>
    );
  }

  const isUpdating = updateOrderMutation.isPending;
  const isRefunding = deleteOrderMutation.isPending;

  const createdAt = new Date(order.createdAt);
  const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;

  return (
    <PageContentWrapper>
      <div className="mx-auto space-y-4">
        {/* Header — Order number + Created X days ago */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
          >
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
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

        {/* Order Status + Payment Status — glassmorphic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <GlassCard variant="amber">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
              Order Status
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "text-sm px-3 py-1.5 rounded-full backdrop-blur-sm font-medium",
                  getStatusBadgeClasses(order.status),
                )}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <DeferredSelectGate
                placeholder={
                  <div
                    className="w-[130px] h-8 text-xs border border-gray-300/30 dark:border-white/10 rounded-md flex items-center px-2 text-gray-700 dark:text-white/80"
                    aria-hidden
                  >
                    {ORDER_STATUSES.find((o) => o.value === order.status)
                      ?.label ?? order.status}
                  </div>
                }
              >
                {({ selectRemountKey }) => (
                  <Select
                    key={selectRemountKey}
                    value={order.status}
                    onValueChange={(v) => handleStatusChange(v as OrderStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs border-gray-300/30 dark:border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </DeferredSelectGate>
            </div>
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

        {/* Order Items — with product / category / supplier links */}
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
                {order.items?.length ?? 0} item
                {(order.items?.length ?? 0) !== 1 ? "s" : ""} in this order
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-gray-700 dark:text-white">
                        {item.productId ? (
                          <Link
                            href={`/admin/products/${item.productId}`}
                            className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          item.productName
                        )}
                      </h4>
                      {item.categoryId && (
                        <Link
                          href={`/admin/categories/${item.categoryId}`}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          Category
                        </Link>
                      )}
                      {item.supplierId && (
                        <Link
                          href={`/admin/suppliers/${item.supplierId}`}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          Supplier
                        </Link>
                      )}
                    </div>
                    {item.sku && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Quantity: {item.quantity} × $
                      {Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right mt-2 sm:mt-0 flex flex-col items-end gap-2">
                    <p className="font-semibold text-sky-600 dark:text-sky-400 text-lg">
                      ${Number(item.subtotal).toFixed(2)}
                    </p>
                    {order.paymentStatus === "paid" && item.productId && (
                      <ProductReviewsSection
                        productId={item.productId}
                        productName={item.productName ?? "Product"}
                        orderId={order.id}
                        compact
                        variant="sky"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No items in this order</p>
            )}
          </div>
        </GlassCard>

        {/* Order Information + Customer + Parties & roles + Invoice link */}
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

          {/* Customer Information */}
          <GlassCard variant="blue">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.blue.iconBg,
                  "dark:border-blue-400/30 dark:bg-blue-500/20",
                )}
              >
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                Customer Information
              </h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Name</dt>
                <dd className="font-medium text-gray-700 dark:text-white">
                  {getCustomerDisplay(order)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Email</dt>
                <dd className="font-medium text-gray-700 dark:text-white">
                  {getCustomerEmail(order)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400">User ID</dt>
                <dd className="font-mono text-xs break-all text-gray-700 dark:text-white">
                  {order.userId}
                </dd>
              </div>
            </dl>
          </GlassCard>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                  Ordered by
                </p>
                <p className="text-gray-700 dark:text-white">
                  {order.placedByName ?? "—"}
                </p>
                {order.placedByEmail && (
                  <span className="text-gray-600 dark:text-gray-400 block text-xs">
                    {order.placedByEmail}
                  </span>
                )}
              </div>
              <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                  Customer / Ship to
                </p>
                <p className="text-gray-700 dark:text-white">
                  {getCustomerDisplay(order)}
                </p>
                {getCustomerEmail(order) !== "—" && (
                  <span className="text-gray-600 dark:text-gray-400 block text-xs">
                    {getCustomerEmail(order)}
                  </span>
                )}
              </div>
              {order.orderProductOwners &&
                order.orderProductOwners.length > 0 && (
                  <div className="sm:col-span-2 p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                      Product owner(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {order.orderProductOwners.map((owner) => (
                        <span
                          key={owner.userId}
                          className="inline-flex items-center gap-1 rounded-md bg-white/50 dark:bg-white/10 px-2 py-1 text-xs border border-teal-200/30 dark:border-teal-400/20 text-gray-700 dark:text-white"
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

        {/* Invoice link (admin) when order has an invoice */}
        {order.invoiceForOrder && (
          <GlassCard variant="violet">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.violet.iconBg,
                  "dark:border-violet-400/30 dark:bg-violet-500/20",
                )}
              >
                <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                Invoice
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              This order has a linked invoice.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl border-violet-300/40"
            >
              <Link href={`/admin/invoices/${order.invoiceForOrder.id}`}>
                View invoice {order.invoiceForOrder.invoiceNumber}
              </Link>
            </Button>
          </GlassCard>
        )}

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

        {/* Order Summary — Subtotal, Tax, Shipping, Discount, Total */}
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
                ${Number(order.subtotal).toFixed(2)}
              </span>
            </div>
            {order.tax != null && order.tax > 0 && (
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-amber-100/40 via-amber-50/20 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="font-medium text-gray-700 dark:text-white">
                  ${Number(order.tax).toFixed(2)}
                </span>
              </div>
            )}
            {order.shipping != null && order.shipping > 0 && (
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent">
                <span className="text-gray-600 dark:text-gray-400">
                  Shipping:
                </span>
                <span className="font-medium text-gray-700 dark:text-white">
                  ${Number(order.shipping).toFixed(2)}
                </span>
              </div>
            )}
            {order.discount != null && order.discount > 0 && (
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-rose-100/40 via-rose-50/20 to-transparent dark:from-rose-500/10 dark:via-rose-500/5 dark:to-transparent">
                <span className="text-gray-600 dark:text-gray-400">
                  Discount:
                </span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  -${Number(order.discount).toFixed(2)}
                </span>
              </div>
            )}
            <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
            <div className="flex justify-between text-lg font-semibold p-2 rounded-xl bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border border-emerald-200/30 dark:border-emerald-400/20">
              <span className="text-gray-700 dark:text-white">Total:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                ${Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Shipping & Tracking — auto generate + manual; when generated show OrderTrackingInfo above */}
        {order.status !== "cancelled" && (
          <GlassCard variant="emerald">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.emerald.iconBg,
                  "dark:border-emerald-400/30 dark:bg-emerald-500/20",
                )}
              >
                <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                Shipping &amp; Tracking
              </h3>
            </div>
            {order.trackingNumber ? (
              <OrderTrackingInfo order={order} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <ShippingManagement
                    order={order}
                    trigger={
                      <Button className="gap-2 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 text-white shadow-[0_15px_35px_rgba(16,185,129,0.45)] dark:shadow-[0_15px_35px_rgba(16,185,129,0.25)] hover:border-emerald-300/50 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40">
                        <Truck className="h-4 w-4" />
                        Generate Shipping Label
                      </Button>
                    }
                  />
                </div>
                <div className="border-t border-emerald-200/30 dark:border-emerald-400/20 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-3">
                    Or enter tracking manually
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 space-y-2">
                      <Label
                        htmlFor="admin-trackingNumber"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Tracking Number
                      </Label>
                      <Input
                        id="admin-trackingNumber"
                        placeholder="Enter tracking number"
                        value={manualTrackingNumber}
                        onChange={(e) =>
                          setManualTrackingNumber(e.target.value)
                        }
                        disabled={isUpdating}
                        className="rounded-xl border-gray-300/30 dark:border-white/10"
                      />
                    </div>
                    <div className="w-full sm:w-40 space-y-2">
                      <Label
                        htmlFor="admin-carrier"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Carrier
                      </Label>
                      <DeferredSelectGate
                        placeholder={
                          <div
                            id="admin-carrier"
                            className="h-10 rounded-xl border border-gray-300/30 dark:border-white/10 flex items-center px-3 text-sm text-gray-700 dark:text-white/80"
                            aria-hidden
                          >
                            {CARRIERS.find((c) => c.value === manualCarrier)
                              ?.label ?? manualCarrier}
                          </div>
                        }
                      >
                        {({ selectRemountKey }) => (
                          <Select
                            key={selectRemountKey}
                            value={manualCarrier}
                            onValueChange={setManualCarrier}
                            disabled={isUpdating}
                          >
                            <SelectTrigger
                              id="admin-carrier"
                              className="rounded-xl border-gray-300/30 dark:border-white/10"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CARRIERS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </DeferredSelectGate>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddTracking}
                        disabled={isUpdating || !manualTrackingNumber.trim()}
                        className="gap-2 rounded-xl"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pencil className="h-4 w-4" />
                        )}
                        Add Tracking Number
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Manually enter tracking. Order status will be updated to
                    &quot;shipped&quot;.
                  </p>
                </div>
              </>
            )}
          </GlassCard>
        )}

        {/* Refund Management */}
        {canRefund && (
          <GlassCard variant="rose">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                Refund Management
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cancel the order and issue a full refund via Stripe. Stock will be
              restored and the linked invoice cancelled. All related pages will
              update.
            </p>
            <AlertDialog
              open={refundDialogOpen}
              onOpenChange={setRefundDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isRefunding}
                  className="rounded-xl"
                >
                  {isRefunding ? "Processing..." : "Process Refund"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cancel this order and issue a full refund via Stripe?
                    Amount:{" "}
                    <span className="font-semibold">
                      ${Number(order.total).toFixed(2)}
                    </span>
                    . Status will be cancelled, stock restored, invoice
                    cancelled, and all related pages will update.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isRefunding}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRefund}
                    disabled={isRefunding}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isRefunding ? "Processing..." : "Confirm Refund"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GlassCard>
        )}
      </div>
    </PageContentWrapper>
  );
}
