"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import {
  ArrowLeft,
  Calendar,
  FilePlus2,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Truck,
} from "lucide-react";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import { useOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import {
  ClientDateTime,
  CopyableText,
  DeferredSelectGate,
  PageContentWrapper,
  DataSlotPulse,
} from "@/components/shared";
import { isDataSlotLoading } from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus, Order } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";
import { cn } from "@/lib/utils";
import { OrderTrackingInfo, ShippingManagement } from "@/components/shipping";
import {
  GlassCard,
  getCustomerDisplay,
  getCustomerEmail,
  OrderDetailHeader,
  OrderItemsCard,
  OrderPartiesCard,
  OrderShippingAddressCard,
  OrderStatusBadges,
  OrderSummaryCard,
  variantConfig,
} from "@/components/orders/detail";

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

export type AdminOrderDetailContentProps = {
  /** Back link target (e.g. "/admin/personal-orders" or "/admin/client-orders") */
  backHref?: string;
  initialOrder?: Order;
  /** REQ-0026 — batch SSR review context for order line items */
  initialReviewContext?: OrderReviewContext;
};

/**
 * Admin Order Detail — view and manage a single order.
 * Status dropdown, Shipping & Tracking (display + manual add), Refund (mark payment as refunded).
 * Matches codebook-ecommerce AdminOrderDetailPage workflow.
 */
export default function AdminOrderDetailContent({
  backHref = "/admin/personal-orders",
  initialOrder,
  initialReviewContext,
}: AdminOrderDetailContentProps = {}) {
  const params = useParams();
  const orderId = params?.id as string;
  const { toast } = useToast();
  // Invalidates order/invoice caches before navigating back so the list shows fresh data
  const { handleBack, navigateTo } = useBackWithRefresh("order");
  const orderQuery = useOrder(orderId, initialOrder);
  const order = orderQuery.data;
  const dataLoading = isDataSlotLoading(orderQuery, initialOrder);
  const { isError, error } = orderQuery;
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  const [manualTrackingNumber, setManualTrackingNumber] = useState("");
  const [manualCarrier, setManualCarrier] = useState("usps");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  // REQ-0061: InvoiceDialog create mode pre-selected with this order
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

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

  const canRefund = !dataLoading && order && order.paymentStatus === "paid";

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigateTo(backHref)}>
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
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigateTo(backHref)}>
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
  const isRefunding = deleteOrderMutation.isPending;
  const actionsDisabled = dataLoading || !order;

  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const updatedAt = order?.updatedAt ? new Date(order.updatedAt) : null;

  return (
    <PageContentWrapper>
      <div className="mx-auto space-y-4">
        {/* onBack invalidates order/invoice TanStack caches before navigating back */}
        <OrderDetailHeader
          onBack={handleBack}
          orderNumber={order?.orderNumber}
          createdAt={createdAt}
          dataLoading={dataLoading}
        />

        <OrderStatusBadges
          status={order?.status}
          paymentStatus={order?.paymentStatus}
          dataLoading={dataLoading}
          statusControl={
            <DeferredSelectGate
              placeholder={
                <div
                  className="w-[130px] h-8 text-xs border border-gray-300/30 dark:border-white/10 rounded-md flex items-center px-2 text-gray-700 dark:text-white/80"
                  aria-hidden
                >
                  {ORDER_STATUSES.find((o) => o.value === order!.status)
                    ?.label ?? order!.status}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={order!.status}
                  onValueChange={(v) => handleStatusChange(v as OrderStatus)}
                  disabled={isUpdating || actionsDisabled}
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
          }
        />

        <OrderItemsCard
          order={order}
          dataLoading={dataLoading}
          linkMode="admin"
          initialReviewContext={initialReviewContext}
        />

        {/* Order Information + Customer — admin-only */}
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
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                Customer Information
              </h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Name</dt>
                <dd className="font-medium text-gray-700 dark:text-white">
                  {dataLoading ? (
                    <DataSlotPulse variant="text-md" className="w-36" />
                  ) : (
                    getCustomerDisplay(order!)
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Email</dt>
                <dd className="font-medium text-gray-700 dark:text-white">
                  {dataLoading ? (
                    <DataSlotPulse variant="text-md" className="w-48" />
                  ) : (
                    getCustomerEmail(order!)
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400">User ID</dt>
                <dd className="font-mono text-xs break-all text-gray-700 dark:text-white">
                  {dataLoading ? (
                    <DataSlotPulse variant="text-sm" className="w-full" />
                  ) : (
                    order!.userId
                  )}
                </dd>
              </div>
            </dl>
          </GlassCard>
        </div>

        <OrderPartiesCard order={order} dataLoading={dataLoading} />

        {/* Invoice card (admin) — link when the order has one, Create when it does not (REQ-0061) */}
        {!dataLoading && order && (
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
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                Invoice
              </h3>
            </div>
            {order.invoiceForOrder ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  This order has a linked invoice.
                </p>
                {/* CopyableText copies the invoice # without following the link */}
                <CopyableText value={order.invoiceForOrder.invoiceNumber}>
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
                </CopyableText>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  No invoice has been generated for this order yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateInvoiceOpen(true)}
                  disabled={order.status === "cancelled"}
                  className="rounded-xl border-violet-300/40"
                >
                  <FilePlus2 className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </>
            )}
          </GlassCard>
        )}

        <OrderShippingAddressCard order={order} dataLoading={dataLoading} />

        <OrderSummaryCard order={order} dataLoading={dataLoading} />

        {/* Shipping & Tracking — auto generate + manual; when generated show OrderTrackingInfo above */}
        {!dataLoading && order && order.status !== "cancelled" && (
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
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                Shipping &amp; Tracking
              </h3>
            </div>
            {order!.trackingNumber ? (
              <OrderTrackingInfo order={order!} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <ShippingManagement
                    order={order!}
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
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
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
                    <span className="font-medium text-gray-700 dark:text-white">
                      ${Number(order!.total).toFixed(2)}
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

      {/* REQ-0061: InvoiceDialog create mode pre-selected with this order */}
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
