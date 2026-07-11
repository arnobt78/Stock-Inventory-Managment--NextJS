/**
 * Order Detail Page
 * Displays detailed information about a single order
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  FilePlus2,
  FileText,
  Truck,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder, useDeleteOrder } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import {
  queryKeys,
  invalidateAfterOrderGraphChange,
  isDataSlotLoading,
} from "@/lib/react-query";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  PageContentWrapper,
  DataSlotPulse,
} from "@/components/shared";
import type { Order } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";
import { cn } from "@/lib/utils";
import { APP_SHELL_DETAIL_CLASS } from "@/lib/ui/shell-layout-styles";
import OrderDialog from "@/components/orders/OrderDialog";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import { PaymentDialog } from "@/components/payments";
import { OrderTrackingInfo, ShippingManagement } from "@/components/shipping";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatAddress,
  GlassCard,
  OrderDetailHeader,
  OrderItemsCard,
  OrderPartiesCard,
  OrderShippingAddressCard,
  OrderStatusBadges,
  OrderSummaryCard,
  variantConfig,
} from "@/components/orders/detail";

export type OrderDetailPageProps = {
  initialOrder?: Order;
  /** REQ-0026 — batch SSR review context for order line items */
  initialReviewContext?: OrderReviewContext;
};

export default function OrderDetailPage({
  initialOrder,
  initialReviewContext,
}: OrderDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { handleBack } = useBackWithRefresh("order");
  const orderId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();

  const orderQuery = useOrder(orderId, initialOrder);
  const order = orderQuery.data;
  const dataLoading = isDataSlotLoading(orderQuery, initialOrder);
  const { isError, error } = orderQuery;

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (
      !orderId ||
      !payment ||
      (payment !== "success" && payment !== "cancelled")
    )
      return;

    const detailKey = queryKeys.orders.detail(orderId);
    invalidateAfterOrderGraphChange(queryClient);
    queryClient.refetchQueries({ queryKey: detailKey });

    const runInvalidations = () => {
      invalidateAfterOrderGraphChange(queryClient);
      queryClient.refetchQueries({ queryKey: detailKey });
    };
    const delays = [500, 1500, 3000, 5000, 8000];
    const timeouts = delays.map((delay) => setTimeout(runInvalidations, delay));

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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  // REQ-0061: InvoiceDialog create mode pre-selected with this order
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  const handleUpdateOrder = useCallback(() => {
    if (!order) return;
    setEditingOrder(order);
    setEditDialogOpen(true);
  }, [order]);

  const handleConfirmCancelOrder = useCallback(() => {
    if (!order) return;
    // useDeleteOrder.onSuccess already calls invalidateAfterOrderGraphChange + cancelOrRemoveDetailQuery.
    // No router.refresh() needed — clicking back will use handleBack which re-invalidates.
    deleteOrderMutation.mutate(order.id, {
      onSuccess: () => {
        setCancelDialogOpen(false);
      },
      onError: () => {
        setCancelDialogOpen(false);
      },
    });
  }, [order, deleteOrderMutation]);

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push("/login");
    }
  }, [user, isCheckingAuth, router]);

  if (isError) {
    return (
      <Navbar>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
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

  if (!dataLoading && !order) {
    return (
      <Navbar>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The order you are looking for does not exist or was removed.
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

  const actionsDisabled = dataLoading || !order || disableOrderActions;

  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const updatedAt = order?.updatedAt ? new Date(order.updatedAt) : null;
  const shippedAt = order?.shippedAt ? new Date(order.shippedAt) : null;
  const deliveredAt = order?.deliveredAt ? new Date(order.deliveredAt) : null;
  const estimatedDelivery = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery)
    : null;

  const hasShipping =
    !dataLoading &&
    !!(
      order?.trackingNumber &&
      (order.status === "shipped" || order.status === "delivered")
    );

  return (
    <Navbar>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <OrderDetailHeader
            onBack={handleBack}
            orderNumber={order?.orderNumber}
            createdAt={createdAt}
            dataLoading={dataLoading}
          />

          <div
            className={cn(
              "grid gap-2",
              hasShipping
                ? "grid-cols-1 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2",
            )}
          >
            <div className={cn(hasShipping && "lg:col-span-2")}>
              <OrderStatusBadges
                status={order?.status}
                paymentStatus={order?.paymentStatus}
                dataLoading={dataLoading}
              />
            </div>
            {hasShipping && order && (
              <div className="lg:col-span-1 min-w-0">
                <OrderTrackingInfo order={order} />
              </div>
            )}
          </div>

          <OrderItemsCard
            order={order}
            dataLoading={dataLoading}
            linkMode="none"
            initialReviewContext={initialReviewContext}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
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
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
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
                    {dataLoading ? (
                      <DataSlotPulse variant="date" />
                    ) : (
                      <ClientDateTime date={createdAt} />
                    )}
                  </span>
                </div>
                {!dataLoading && updatedAt && (
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
                {!dataLoading && shippedAt && (
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
                {!dataLoading && deliveredAt && (
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
                {!dataLoading && estimatedDelivery && (
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
                {!dataLoading && order?.trackingNumber && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                    <Truck className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Tracking:
                    </span>
                    {order!.trackingUrl ? (
                      <a
                        href={order!.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      >
                        {order!.trackingNumber}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-700 dark:text-white">
                        {order!.trackingNumber}
                      </span>
                    )}
                  </div>
                )}
                {!dataLoading && order?.notes && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white">
                      {order!.notes}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            <OrderPartiesCard order={order} dataLoading={dataLoading} />

            <div className="space-y-4">
              <OrderShippingAddressCard
                order={order}
                dataLoading={dataLoading}
              />

              {!dataLoading && order?.billingAddress && (
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
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Billing Address
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-blue-100/40 via-blue-50/20 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                    {formatAddress(order!.billingAddress)}
                  </p>
                </GlassCard>
              )}

              <OrderSummaryCard order={order} dataLoading={dataLoading} />
            </div>
          </div>

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
                    disabled={actionsDisabled}
                    className="w-full sm:w-auto gap-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30 text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)] backdrop-blur-md hover:border-blue-300/50 hover:from-blue-500/80 hover:via-blue-500/60 hover:to-blue-500/40 transition-all duration-300 disabled:opacity-50"
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
            {/* REQ-0061: situation-based invoice action — View when linked, Create when absent */}
            {!dataLoading && order && order.invoiceForOrder ? (
              <Button
                asChild
                className="w-full sm:w-auto gap-2 rounded-xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/70 via-indigo-500/50 to-indigo-500/30 text-white shadow-[0_10px_25px_rgba(99,102,241,0.35)] backdrop-blur-md hover:border-indigo-300/50 hover:from-indigo-500/80 hover:via-indigo-500/60 hover:to-indigo-500/40 transition-all duration-300"
              >
                <Link href={`/invoices/${order.invoiceForOrder.id}`}>
                  <FileText className="h-4 w-4 shrink-0" />
                  View Invoice
                </Link>
              </Button>
            ) : (
              !dataLoading &&
              order &&
              order.status !== "cancelled" &&
              !disableOrderActions && (
                <Button
                  onClick={() => setCreateInvoiceOpen(true)}
                  className="w-full sm:w-auto gap-2 rounded-xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/70 via-indigo-500/50 to-indigo-500/30 text-white shadow-[0_10px_25px_rgba(99,102,241,0.35)] backdrop-blur-md hover:border-indigo-300/50 hover:from-indigo-500/80 hover:via-indigo-500/60 hover:to-indigo-500/40 transition-all duration-300"
                >
                  <FilePlus2 className="h-4 w-4 shrink-0" />
                  Create Invoice
                </Button>
              )
            )}
            {!dataLoading &&
              order &&
              order.paymentStatus !== "paid" &&
              order.status !== "cancelled" && (
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
                            className="w-full sm:w-auto gap-2 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] backdrop-blur-md hover:border-emerald-300/50 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40 transition-all duration-300 disabled:opacity-50"
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
            {!dataLoading &&
              order &&
              order.status !== "cancelled" &&
              order.status !== "shipped" &&
              order.status !== "delivered" &&
              !order.trackingNumber && (
                <ShippingManagement
                  order={order}
                  disabled={disableOrderActions}
                  trigger={
                    <Button
                      disabled={disableOrderActions}
                      className="w-full sm:w-auto gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 text-white shadow-[0_10px_25px_rgba(139,92,246,0.35)] backdrop-blur-md hover:border-violet-300/50 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 transition-all duration-300 disabled:opacity-50"
                    >
                      <Truck className="h-4 w-4 shrink-0" />
                      Ship Order
                    </Button>
                  }
                />
              )}
            {!dataLoading && order && order.status !== "cancelled" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={isCancelling || actionsDisabled}
                      className="w-full sm:w-auto gap-2 rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 text-white shadow-[0_10px_25px_rgba(225,29,72,0.35)] backdrop-blur-md hover:border-rose-300/50 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 transition-all duration-300 disabled:opacity-50"
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

          {order && (
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
          )}

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

          {/* REQ-0061: InvoiceDialog create mode pre-selected with this order */}
          {createInvoiceOpen && order && (
            <InvoiceDialog
              open={createInvoiceOpen}
              onOpenChange={setCreateInvoiceOpen}
              editingInvoice={null}
              initialOrderId={order.id}
            />
          )}
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
