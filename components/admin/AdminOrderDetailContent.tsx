"use client";

/**
 * REQ-0208 / REQ-0209 — Admin order detail parity with `/orders/[id]`:
 * read-only status badges; OrderDialog for edits; shared OrderDetailActionBar
 * (Cancel unpaid|partial; Process Refund when fully paid); no Customer/Invoice side cards.
 */

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  Package,
  CreditCard,
  Pencil,
  Truck,
  Hash,
} from "lucide-react";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import OrderDialog from "@/components/orders/OrderDialog";
import { useOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useStripeCheckoutReturn } from "@/hooks/use-stripe-checkout-return";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";
import {
  ClientDateTime,
  CopyableText,
  DeferredSelectGate,
  DetailInfoRowGroup,
  PageContentWrapper,
  GLASS_GHOST_BUTTON,
  glassDetailFooterButtonClass,
  AuditUserDetailRow,
} from "@/components/shared";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";
import { cn } from "@/lib/utils";
import { OrderTrackingInfo, ShippingManagement } from "@/components/shipping";
import { AlertDialogWrapper } from "@/components/dialogs";
import {
  GlassCard,
  DetailInfoRow,
  OrderDetailHeader,
  OrderDetailActionBar,
  OrderItemsCard,
  OrderPartiesCard,
  OrderShippingAddressCard,
  OrderStatusBadges,
  OrderSummaryCard,
  variantConfig,
} from "@/components/orders/detail";
import { APP_SHELL_DETAIL_CLASS } from "@/lib/ui/shell-layout-styles";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import {
  getOrderCancelConfirmDescription,
  getOrderRefundConfirmDescription,
} from "@/lib/orders/order-destructive-copy";

const CARRIERS = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
];

export type AdminOrderDetailContentProps = {
  /** Back link target (e.g. "/admin/orders") */
  backHref?: string;
  initialOrder?: Order;
  /** REQ-0026 — batch SSR review context for order line items */
  initialReviewContext?: OrderReviewContext;
};

/**
 * Admin Order Detail — view and manage a single order.
 * Status/fields via OrderDialog; footer actions via OrderDetailActionBar (REQ-0208).
 */
export default function AdminOrderDetailContent({
  backHref = "/admin/orders",
  initialOrder,
  initialReviewContext,
}: AdminOrderDetailContentProps = {}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const { toast } = useToast();
  // Log-proven: admin must pass fallbackPath so Back always returns to list (not router.back history)
  const { handleBack, navigateTo } = useBackWithRefresh("order", {
    fallbackPath: backHref,
  });
  const orderQuery = useOrder(orderId, initialOrder);
  const order = orderQuery.data;
  const dataLoading = isDataSlotLoading(orderQuery, initialOrder);
  const { isError, error } = orderQuery;

  useSyncSsrQueryData(queryKeys.orders.detail(orderId), initialOrder);
  // REQ-0209 — confirm session on return (webhook may hit production, not localhost)
  useStripeCheckoutReturn({ entityId: orderId, entity: "order" });

  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  const [manualTrackingNumber, setManualTrackingNumber] = useState("");
  const [manualCarrier, setManualCarrier] = useState("usps");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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
          trackingCarrier: manualCarrier,
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
  }, [
    orderId,
    manualTrackingNumber,
    manualCarrier,
    updateOrderMutation,
    toast,
  ]);

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
        toast({
          title: "Order cancelled",
          description: "Stock restored and related pages updated.",
        });
      },
      onError: (err) => {
        setCancelDialogOpen(false);
        toast({
          title: "Cancel failed",
          description:
            err instanceof Error ? err.message : "Failed to cancel order.",
          variant: "destructive",
        });
      },
    });
  }, [order, deleteOrderMutation, toast]);

  const handleRefund = useCallback(() => {
    if (!orderId) return;
    // Cancel API: Stripe refund + status cancelled + stock restored + invoice cancelled
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

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button
            size="sm"
            onClick={() => navigateTo(backHref)}
            className={cn("gap-2", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
          <div className="rounded-[20px] border border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 sm:p-6 text-center">
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Order not found"}
            </p>
          </div>
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !order) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button
            size="sm"
            onClick={() => navigateTo(backHref)}
            className={cn("gap-2", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
          <div className="rounded-[20px] border border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 sm:p-6 text-center">
            <p className="text-muted-foreground">
              The order you are looking for does not exist or was removed.
            </p>
          </div>
        </div>
      </PageContentWrapper>
    );
  }

  const isUpdating = updateOrderMutation.isPending;
  const isRefunding = deleteOrderMutation.isPending && refundDialogOpen;
  const isCancelling = deleteOrderMutation.isPending && cancelDialogOpen;

  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const updatedAt = order?.updatedAt ? new Date(order.updatedAt) : null;
  const hasShipping =
    !dataLoading &&
    !!(
      order?.trackingNumber &&
      (order.status === "shipped" || order.status === "delivered")
    );

  return (
    <PageContentWrapper>
      <div className={APP_SHELL_DETAIL_CLASS}>
        <OrderDetailHeader
          onBack={handleBack}
          orderNumber={order?.orderNumber}
          createdAt={createdAt}
          dataLoading={dataLoading}
        />

        {/* REQ-0146 — equal-height status stack + tracking when shipped; REQ-0208 read-only badges */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
          <OrderItemsCard
            order={order}
            dataLoading={dataLoading}
            linkMode="admin"
            warehouseLinkMode="admin"
            initialReviewContext={initialReviewContext}
          />
          <OrderSummaryCard order={order} dataLoading={dataLoading} />
        </div>

        {/* REQ-0208 — Info | Parties + ShipAddr + Shipping card (invoice slot) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-start">
          <div className="flex flex-col gap-2 sm:gap-4 min-w-0">
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
                              href={`/admin/invoices/${order.invoiceForOrder.id}`}
                              className="text-sky-600 dark:text-sky-400 hover:text-sky-500 font-normal"
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
                              href={`/admin/invoices/${order.invoiceForOrder.id}`}
                              className="text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              View invoice for payment breakdown
                            </Link>
                          </>
                        )}
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
                    {!dataLoading && (
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
                {!dataLoading && order?.creator && (
                  <AuditUserDetailRow
                    label="Created by:"
                    tone="violet"
                    user={order.creator}
                    href={resolveDetailAuditUserHref(order.creator.id, true)}
                  />
                )}
                {!dataLoading && order?.updater && (
                  <AuditUserDetailRow
                    label="Updated by:"
                    tone="blue"
                    user={order.updater}
                    href={resolveDetailAuditUserHref(order.updater.id, true)}
                  />
                )}
                {!dataLoading && order?.notes && (
                  <DetailInfoRow icon={FileText} label="Notes:" tone="teal">
                    {order.notes}
                  </DetailInfoRow>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="flex flex-col gap-2 sm:gap-4 min-w-0">
            <OrderPartiesCard
              order={order}
              dataLoading={dataLoading}
              isAdminRole
            />
            <OrderShippingAddressCard order={order} dataLoading={dataLoading} />
            {/* REQ-0208 — Shipping & Tracking in former Invoice card slot */}
            {!dataLoading &&
              order &&
              order.status !== "cancelled" &&
              !hasShipping && (
                <GlassCard variant="emerald" className="overflow-visible">
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
                    <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                      Shipping & Tracking
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <ShippingManagement
                      order={order}
                      trigger={
                        <Button
                          className={glassDetailFooterButtonClass(
                            "emerald",
                            "w-auto",
                          )}
                        >
                          <Truck className="h-4 w-4 shrink-0" />
                          Generate Shipping Label
                        </Button>
                      }
                    />
                  </div>
                  {/* overflow-visible — glass CTA glow must not clip */}
                  <div className="border-t border-emerald-200/30 dark:border-emerald-400/20 pt-4 overflow-visible">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-3">
                      Or enter tracking manually
                    </h4>
                    <div className="flex flex-col gap-3 overflow-visible">
                      <div className="flex flex-col sm:flex-row gap-2 overflow-visible">
                        <div className="flex-1 space-y-2 min-w-0">
                          <label
                            htmlFor="admin-trackingNumber"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            <Hash className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            Tracking Number
                          </label>
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
                        <div className="w-full sm:w-40 space-y-2 shrink-0">
                          <label
                            htmlFor="admin-carrier"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            <Truck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            Carrier
                          </label>
                          <DeferredSelectGate
                            placeholder={
                              <div
                                id="admin-carrier"
                                className="h-10 rounded-xl border border-gray-300/30 dark:border-white/10 flex items-center px-2 text-sm text-gray-700 dark:text-white/80"
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
                                  <SelectValue>
                                    {CARRIERS.find(
                                      (c) => c.value === manualCarrier,
                                    )?.label ?? manualCarrier}
                                  </SelectValue>
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
                      </div>
                      <div className="flex justify-end overflow-visible pb-1">
                        <Button
                          onClick={handleAddTracking}
                          disabled={
                            isUpdating || !manualTrackingNumber.trim()
                          }
                          className={glassDetailFooterButtonClass(
                            "sky",
                            "w-full sm:w-auto px-8",
                          )}
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
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                      Manually enter tracking. Order status will be updated to
                      &quot;shipped&quot;.
                    </p>
                  </div>
                </GlassCard>
              )}
          </div>
        </div>

        <OrderDetailActionBar
          order={order}
          dataLoading={dataLoading}
          invoiceHrefBase="/admin/invoices"
          mode="admin"
          disableOrderActions={false}
          isCancelling={isCancelling}
          isRefunding={isRefunding}
          onBack={handleBack}
          onUpdateOrder={handleUpdateOrder}
          onCreateInvoice={() => setCreateInvoiceOpen(true)}
          onCancelClick={() => setCancelDialogOpen(true)}
          onRefundClick={() => setRefundDialogOpen(true)}
        />
      </div>

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
          onAction={handleRefund}
          onCancel={() => setRefundDialogOpen(false)}
        />
      )}

      <OrderDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingOrder(null);
        }}
        editingOrder={editingOrder}
        onEditOrder={(next) => {
          setEditingOrder(next ?? null);
        }}
      >
        <div style={{ display: "none" }} aria-hidden />
      </OrderDialog>

      {createInvoiceOpen && order && (
        <InvoiceDialog
          open={createInvoiceOpen}
          onOpenChange={setCreateInvoiceOpen}
          editingInvoice={null}
          initialOrderId={order.id}
        />
      )}
    </PageContentWrapper>
  );
}
