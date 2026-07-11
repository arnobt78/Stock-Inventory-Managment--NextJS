/**
 * Order Detail Page
 * Displays detailed information about a single order
 */

"use client";

import { markStripeCheckoutReturn } from "@/lib/payments/stripe-return";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Hash,
  Ban,
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
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  PageContentWrapper,
  DataSlotPulse,
  GLASS_GHOST_BUTTON,
  glassDetailFooterButtonClass,
  CopyableText,
  DialogSubmitButton,
} from "@/components/shared";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
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
  DetailInfoRow,
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
  const { user, isCheckingAuth } = useAuth();
  const ordersListPath = useMemo(() => {
    if (user?.role === "admin" || user?.role === "user") return "/admin/orders";
    return "/orders";
  }, [user?.role]);
  const { handleBack } = useBackWithRefresh("order", {
    fallbackPath: ordersListPath,
  });
  const orderId = params?.id as string;

  const orderQuery = useOrder(orderId, initialOrder);
  const order = orderQuery.data;
  const dataLoading = isDataSlotLoading(orderQuery, initialOrder);
  const { isError, error } = orderQuery;

  useSyncSsrQueryData(queryKeys.orders.detail(orderId), initialOrder);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (
      !orderId ||
      !payment ||
      (payment !== "success" && payment !== "cancelled")
    )
      return;

    markStripeCheckoutReturn();

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
      window.location.replace(path);
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
  const cancelledAt = order?.cancelledAt ? new Date(order.cancelledAt) : null;
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
                {!dataLoading && order && (
                  <>
                    <DetailInfoRow icon={FileText} label="Order #:" tone="orange">
                      <CopyableText value={order.orderNumber}>
                        {order.orderNumber}
                      </CopyableText>
                    </DetailInfoRow>
                    <DetailInfoRow icon={Hash} label="Order ID:" tone="violet">
                      <span className="font-mono text-xs">{order.id}</span>
                    </DetailInfoRow>
                    <DetailInfoRow icon={Package} label="Status:" tone="sky">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </span>
                    </DetailInfoRow>
                    {order.paymentStatus === "partial" && (
                      <DetailInfoRow icon={CreditCard} label="Payment:" tone="amber">
                        Partial payment — total ${order.total.toFixed(2)}
                        {order.invoiceForOrder && (
                          <>
                            {" · "}
                            <Link
                              href={`/invoices/${order.invoiceForOrder.id}`}
                              className="text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              View invoice for payment breakdown
                            </Link>
                          </>
                        )}
                      </DetailInfoRow>
                    )}
                    {order.stripePaymentIntentId && (
                      <DetailInfoRow icon={CreditCard} label="Stripe:" tone="blue">
                        <span className="font-mono text-xs break-all">
                          {order.stripePaymentIntentId}
                        </span>
                      </DetailInfoRow>
                    )}
                  </>
                )}
                <DetailInfoRow icon={Calendar} label="Created:" tone="orange" loading={dataLoading}>
                  {!dataLoading && <ClientDateTime date={createdAt} />}
                </DetailInfoRow>
                {(dataLoading || updatedAt) && (
                  <DetailInfoRow icon={Calendar} label="Updated:" tone="amber" loading={dataLoading}>
                    {!dataLoading && updatedAt && <ClientDateTime date={updatedAt} />}
                  </DetailInfoRow>
                )}
                {(dataLoading || shippedAt) && (
                  <DetailInfoRow icon={Truck} label="Shipped:" tone="sky" loading={dataLoading}>
                    {!dataLoading && shippedAt && <ClientDateTime date={shippedAt} />}
                  </DetailInfoRow>
                )}
                {(dataLoading || deliveredAt) && (
                  <DetailInfoRow icon={Package} label="Delivered:" tone="emerald" loading={dataLoading}>
                    {!dataLoading && deliveredAt && <ClientDateTime date={deliveredAt} />}
                  </DetailInfoRow>
                )}
                {(dataLoading || cancelledAt) && (
                  <DetailInfoRow icon={Ban} label="Cancelled:" tone="rose" loading={dataLoading}>
                    {!dataLoading && cancelledAt && <ClientDateTime date={cancelledAt} />}
                  </DetailInfoRow>
                )}
                {(dataLoading || estimatedDelivery) && (
                  <DetailInfoRow icon={Calendar} label="Estimated Delivery:" tone="violet" loading={dataLoading}>
                    {!dataLoading && estimatedDelivery && (
                      <ClientDate date={estimatedDelivery} />
                    )}
                  </DetailInfoRow>
                )}
                {!dataLoading && order?.trackingNumber && (
                  <DetailInfoRow icon={Truck} label="Tracking:" tone="blue">
                    {order.trackingUrl ? (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      >
                        {order.trackingNumber}
                      </a>
                    ) : (
                      order.trackingNumber
                    )}
                  </DetailInfoRow>
                )}
                {!dataLoading && order?.notes && (
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
              variant="ghost"
              onClick={handleBack}
              className={cn("w-full sm:w-auto gap-2", GLASS_GHOST_BUTTON)}
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
                    className={glassDetailFooterButtonClass("blue")}
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
                className={glassDetailFooterButtonClass("indigo")}
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
                  className={glassDetailFooterButtonClass("indigo")}
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
                            className={glassDetailFooterButtonClass("emerald")}
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
                      className={glassDetailFooterButtonClass("violet")}
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
                    <DialogSubmitButton
                      type="button"
                      onClick={() => setCancelDialogOpen(true)}
                      isPending={isCancelling}
                      pendingLabel="Cancelling…"
                      label="Cancel Order"
                      hue="rose"
                      disabled={actionsDisabled}
                      className="group w-full sm:w-auto gap-2"
                    />
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
