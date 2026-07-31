/**
 * Order Detail Page
 * Displays detailed information about a single order
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useStripeCheckoutReturn } from "@/hooks/use-stripe-checkout-return";
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  StickyNote,
  CircleDollarSign,
  Truck,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useOrder, useDeleteOrder } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";
import {
  queryKeys,
  isDataSlotLoading,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDate,
  ClientDateTime,
  PageContentWrapper,
  CopyableText,
  AuditUserDetailRow,
  DetailInfoRowGroup,
  SectionCardHeader,
} from "@/components/shared";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import type { Order } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";
import { cn } from "@/lib/utils";
import { toDateOrNull } from "@/lib/format";
import { APP_SHELL_DETAIL_CLASS } from "@/lib/ui/shell-layout-styles";
import { TYPO_CARD_TITLE } from "@/lib/ui/typography-scale";
import OrderDialog from "@/components/orders/OrderDialog";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import {
  CarrierGlassBadge,
  OrderTrackingInfo,
} from "@/components/shipping";
import {
  formatAddress,
  DetailInfoRow,
  GlassCard,
  OrderDetailHeader,
  OrderDetailActionBar,
  OrderItemsCard,
  OrderPartiesCard,
  OrderShippingAddressCard,
  OrderStatusBadges,
  OrderSummaryCard,
} from "@/components/orders/detail";
import {
  getOrderCancelConfirmDescription,
  getOrderRefundConfirmDescription,
} from "@/lib/orders/order-destructive-copy";

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
  const pathname = usePathname() ?? "";
  const { user, isCheckingAuth } = useAuth();
  // REQ-0209 — back list follows current route shell (not role): /orders vs /admin/orders
  const ordersListPath = useMemo(
    () => (pathname.startsWith("/admin") ? "/admin/orders" : "/orders"),
    [pathname],
  );
  const { handleBack } = useBackWithRefresh("order", {
    fallbackPath: ordersListPath,
  });
  const orderId = params?.id as string;

  const orderQuery = useOrder(orderId, initialOrder);
  const order = orderQuery.data;
  const dataLoading = isDataSlotLoading(orderQuery, initialOrder);
  const { isError, error } = orderQuery;

  useSyncSsrQueryData(queryKeys.orders.detail(orderId), initialOrder);
  useStripeCheckoutReturn({ entityId: orderId, entity: "order" });

  const deleteOrderMutation = useDeleteOrder();
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const isAdminRole = user?.role === "admin";
  const disableOrderActions = isSupplierRole || isClientRole;
  // REQ-0214 — catalog-history clients may open others' ORD; Pay only for assigned buyer
  const isOrderBuyer =
    Boolean(user?.id) &&
    (order?.clientId === user?.id ||
      (order != null && !order.clientId && order.userId === user?.id));
  const allowPayOrder =
    !isSupplierRole && (isAdminRole || user?.role === "user" || isOrderBuyer);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  // REQ-0061: InvoiceDialog create mode pre-selected with this order
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  // Dialog stays open while pending (AlertDialog preventDefault) — spinner uses isPending
  const isCancelling = deleteOrderMutation.isPending && cancelDialogOpen;
  const isRefunding = deleteOrderMutation.isPending && refundDialogOpen;

  const handleUpdateOrder = useCallback(() => {
    if (!order) return;
    setEditingOrder(order);
    setEditDialogOpen(true);
  }, [order]);

  const handleConfirmCancelOrder = useCallback(() => {
    if (!order) return;
    // useDeleteOrder.onSuccess already calls invalidateAfterOrderGraphChange + cancelOrRemoveDetailQuery.
    deleteOrderMutation.mutate(order.id, {
      onSuccess: () => {
        setCancelDialogOpen(false);
      },
      onError: () => {
        setCancelDialogOpen(false);
      },
    });
  }, [
    order,
    deleteOrderMutation,
    cancelDialogOpen,
    ordersListPath,
  ]);

  // REQ-0209 — Process Refund uses same cancel API (Stripe refund + stock restore)
  const handleConfirmRefundOrder = useCallback(() => {
    if (!order) return;
    deleteOrderMutation.mutate(order.id, {
      onSuccess: () => {
        setRefundDialogOpen(false);
      },
      onError: () => {
        setRefundDialogOpen(false);
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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

  // REQ-0136 — never fall back to `new Date()` ("now"): SSR/client render at different
  // instants and that non-determinism is a classic hydration-mismatch source.
  const createdAt = toDateOrNull(order?.createdAt);
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

          {/* REQ-0146 — equal-height status stack + tracking when shipped */}
          {hasShipping && order ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-stretch">
              <OrderStatusBadges
                status={order.status}
                paymentStatus={order.paymentStatus}
                dataLoading={dataLoading}
                layout="stack"
                className="h-full"
              />
              <OrderTrackingInfo order={order} className="h-full" />
            </div>
          ) : (
            <OrderStatusBadges
              status={order?.status}
              paymentStatus={order?.paymentStatus}
              dataLoading={dataLoading}
              layout="grid"
            />
          )}

          {/* REQ-0147 — Items | Summary equal-height row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
            <OrderItemsCard
              order={order}
              dataLoading={dataLoading}
              linkMode={
                user?.role === "admin"
                  ? "admin"
                  : user?.role === "client" || user?.role === "supplier"
                    ? "portal"
                    : "none"
              }
              warehouseLinkMode={
                user?.role === "admin"
                  ? "admin"
                  : user?.role === "user"
                    ? "owner"
                    : "none"
              }
              initialReviewContext={initialReviewContext}
            />
            <OrderSummaryCard order={order} dataLoading={dataLoading} />
          </div>

          {/* REQ-0147 — Info | Parties + addresses stack (content-height, no empty stretch) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-start">
            <GlassCard variant="orange">
              <SectionCardHeader
                title="Order Information"
                icon={FileText}
                tone="orange"
                className="mb-4"
                titleClassName={cn(
                  TYPO_CARD_TITLE,
                  "text-gray-700 dark:text-white",
                )}
              />

              <div className="space-y-2">
                {!dataLoading && order && (
                  <>
                    <DetailInfoRow
                      icon={FileText}
                      label="Order #:"
                      tone="orange"
                    >
                      <CopyableText value={order.orderNumber}>
                        {order.orderNumber}
                      </CopyableText>
                    </DetailInfoRow>
                    <DetailInfoRow icon={Hash} label="Order ID:" tone="violet">
                      <CopyableText value={order.id}>
                        <span className="font-mono text-xs">{order.id}</span>
                      </CopyableText>
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={Package}
                      label="Order Status:"
                      tone="sky"
                    >
                      <OrderStatusBadge status={order.status} />
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={CreditCard}
                      label="Payment Status:"
                      tone="emerald"
                    >
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </DetailInfoRow>
                    {/* REQ-0147 — invoice snapshot in Order Information */}
                    {order.invoiceForOrder && (
                      <DetailInfoRow
                        icon={FileText}
                        label="Invoice:"
                        tone="violet"
                      >
                        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                          <CopyableText
                            value={order.invoiceForOrder.invoiceNumber}
                          >
                            <Link
                              href={
                                isAdminRole
                                  ? `/admin/invoices/${order.invoiceForOrder.id}`
                                  : `/invoices/${order.invoiceForOrder.id}`
                              }
                              className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal"
                            >
                              {order.invoiceForOrder.invoiceNumber}
                            </Link>
                          </CopyableText>
                          {order.invoiceForOrder.amountDue != null && (
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-normal">
                              · $
                              {Number(order.invoiceForOrder.amountDue).toFixed(
                                2,
                              )}{" "}
                              due
                            </span>
                          )}
                        </span>
                      </DetailInfoRow>
                    )}
                    {order.paymentStatus === "partial" && (
                      <DetailInfoRow
                        icon={CreditCard}
                        label="Payment:"
                        tone="amber"
                      >
                        Partial payment — total ${order.total.toFixed(2)}
                        {order.invoiceForOrder && (
                          <>
                            {" · "}
                            <Link
                              href={
                                isAdminRole
                                  ? `/admin/invoices/${order.invoiceForOrder.id}`
                                  : `/invoices/${order.invoiceForOrder.id}`
                              }
                              className="text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              View invoice for payment breakdown
                            </Link>
                          </>
                        )}
                      </DetailInfoRow>
                    )}
                    {order.stripePaymentIntentId && (
                      <DetailInfoRow
                        icon={CreditCard}
                        label="Stripe:"
                        tone="blue"
                      >
                        <CopyableText value={order.stripePaymentIntentId}>
                          <span className="font-mono text-xs break-all">
                            {order.stripePaymentIntentId}
                          </span>
                        </CopyableText>
                      </DetailInfoRow>
                    )}
                  </>
                )}
                <DetailInfoRowGroup>
                  <DetailInfoRow
                    icon={Calendar}
                    label="Created:"
                    tone="orange"
                    loading={dataLoading}
                  >
                    {!dataLoading && createdAt && (
                      <ClientDateTime date={createdAt} semantic="created" />
                    )}
                  </DetailInfoRow>
                  {(dataLoading || updatedAt) && (
                    <DetailInfoRow
                      icon={Calendar}
                      label="Updated:"
                      tone="amber"
                      loading={dataLoading}
                    >
                      {!dataLoading && updatedAt && (
                        <ClientDateTime date={updatedAt} semantic="updated" />
                      )}
                    </DetailInfoRow>
                  )}
                </DetailInfoRowGroup>
                {(dataLoading ||
                  (order?.paymentStatus === "paid" && order?.paidAt)) && (
                  <DetailInfoRow
                    icon={CircleDollarSign}
                    label="Paid:"
                    tone="emerald"
                    loading={dataLoading}
                  >
                    {!dataLoading && order?.paidAt && (
                      <ClientDateTime
                        date={new Date(order.paidAt)}
                        semantic="paid"
                      />
                    )}
                  </DetailInfoRow>
                )}
                {(dataLoading || shippedAt) && (
                  <DetailInfoRow
                    icon={Truck}
                    label="Shipped:"
                    tone="sky"
                    loading={dataLoading}
                  >
                    {!dataLoading && shippedAt && (
                      <ClientDateTime date={shippedAt} semantic="shipped" />
                    )}
                  </DetailInfoRow>
                )}
                {(dataLoading || deliveredAt) && (
                  <DetailInfoRow
                    icon={Package}
                    label="Delivered:"
                    tone="emerald"
                    loading={dataLoading}
                  >
                    {!dataLoading && deliveredAt && (
                      <ClientDateTime date={deliveredAt} semantic="delivered" />
                    )}
                  </DetailInfoRow>
                )}
                {(dataLoading || cancelledAt) && (
                  <DetailInfoRow
                    icon={Ban}
                    label="Cancelled:"
                    tone="rose"
                    loading={dataLoading}
                  >
                    {!dataLoading && cancelledAt && (
                      <ClientDateTime date={cancelledAt} semantic="cancelled" />
                    )}
                  </DetailInfoRow>
                )}
                {(dataLoading || estimatedDelivery) && (
                  <DetailInfoRow
                    icon={Calendar}
                    label="Estimated Delivery:"
                    tone="violet"
                    loading={dataLoading}
                  >
                    {!dataLoading && estimatedDelivery && (
                      <ClientDate
                        date={estimatedDelivery}
                        semantic="scheduled"
                      />
                    )}
                  </DetailInfoRow>
                )}
                {!dataLoading && order?.trackingNumber && (
                  <DetailInfoRow icon={Truck} label="Tracking:" tone="blue">
                    <span className="inline-flex flex-wrap items-center gap-2 min-w-0">
                      <CarrierGlassBadge carrier={order.trackingCarrier} />
                      <CopyableText value={order.trackingNumber}>
                        {order.trackingUrl ? (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal"
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="font-mono text-sm font-normal">
                            {order.trackingNumber}
                          </span>
                        )}
                      </CopyableText>
                    </span>
                  </DetailInfoRow>
                )}
                <AuditUserDetailRow
                  label="Created by:"
                  tone="violet"
                  user={order?.creator}
                  loading={dataLoading && !order?.creator}
                  href={
                    order?.creator
                      ? resolveDetailAuditUserHref(
                          order.creator.id,
                          isAdminRole,
                        )
                      : undefined
                  }
                />
                <AuditUserDetailRow
                  label="Updated by:"
                  tone="blue"
                  user={order?.updater}
                  loading={dataLoading && !order?.updater}
                  href={
                    order?.updater
                      ? resolveDetailAuditUserHref(
                          order.updater.id,
                          isAdminRole,
                        )
                      : undefined
                  }
                />
                {!dataLoading && order?.notes && (
                  <DetailInfoRow icon={StickyNote} label="Notes:" tone="teal">
                    {order.notes}
                  </DetailInfoRow>
                )}
              </div>
            </GlassCard>

            <div className="flex flex-col gap-2 sm:gap-4 min-w-0">
              <OrderPartiesCard
                order={order}
                dataLoading={dataLoading}
                isAdminRole={isAdminRole}
              />
              <OrderShippingAddressCard
                order={order}
                dataLoading={dataLoading}
              />
              {(dataLoading || order?.billingAddress) && (
                <GlassCard variant="blue">
                  <SectionCardHeader
                    title="Billing Address"
                    icon={CreditCard}
                    tone="blue"
                    className="mb-3"
                    titleClassName={cn(
                      TYPO_CARD_TITLE,
                      "text-gray-700 dark:text-white",
                    )}
                  />
                  <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-blue-100/40 via-blue-50/20 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                    {dataLoading ? null : formatAddress(order!.billingAddress)}
                  </p>
                </GlassCard>
              )}
            </div>
          </div>

          {/* REQ-0209 — Cancel unpaid|partial; Process Refund when fully paid */}
          <OrderDetailActionBar
            order={order}
            dataLoading={dataLoading}
            invoiceHrefBase="/invoices"
            mode="store"
            disableOrderActions={disableOrderActions}
            isSupplierRole={isSupplierRole}
            allowPay={allowPayOrder}
            isCancelling={isCancelling}
            isRefunding={isRefunding}
            onBack={handleBack}
            onUpdateOrder={handleUpdateOrder}
            onCreateInvoice={() => setCreateInvoiceOpen(true)}
            onCancelClick={() => setCancelDialogOpen(true)}
            onRefundClick={() => setRefundDialogOpen(true)}
          />

          {order && (
            <AlertDialogWrapper
              open={cancelDialogOpen}
              onOpenChange={setCancelDialogOpen}
              title="Cancel Order"
              description={getOrderCancelConfirmDescription(order)}
              actionLabel="Cancel Order"
              actionLoadingLabel="Cancelling..."
              isLoading={isCancelling}
              onAction={handleConfirmCancelOrder}
              onCancel={() => setCancelDialogOpen(false)}
            />
          )}

          {order && (
            <AlertDialogWrapper
              open={refundDialogOpen}
              onOpenChange={setRefundDialogOpen}
              title="Process Refund"
              description={getOrderRefundConfirmDescription(order)}
              actionLabel="Process Refund"
              actionLoadingLabel="Processing..."
              isLoading={isRefunding}
              onAction={handleConfirmRefundOrder}
              onCancel={() => setRefundDialogOpen(false)}
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
