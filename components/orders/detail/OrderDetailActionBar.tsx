"use client";

/**
 * REQ-0208 / REQ-0209 — Shared order detail footer actions (store + admin).
 * REQ-0209 — Cancel Order for unpaid|partial; Process Refund for fully paid (both modes).
 * Mutations stay in parent (same DELETE cancel API; partial/paid refunds Stripe server-side).
 */

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CreditCard,
  Edit,
  FilePlus2,
  FileText,
  RefreshCw,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogSubmitButton,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
} from "@/components/shared";
import { PaymentDialog } from "@/components/payments";
import { ShippingManagement } from "@/components/shipping";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Order } from "@/types";
import { resolveOrderPayAmount } from "@/lib/payments/resolve-order-pay-amount";
import { canGenerateShippingLabel } from "@/lib/orders/order-ship-eligibility";

export type OrderDetailActionBarProps = {
  order?: Order;
  dataLoading: boolean;
  /** Store: `/invoices` · Admin: `/admin/invoices` */
  invoiceHrefBase: "/invoices" | "/admin/invoices";
  mode: "store" | "admin";
  /** Client/supplier cannot mutate order (store); admin always false */
  disableOrderActions: boolean;
  isSupplierRole?: boolean;
  isCancelling: boolean;
  /** Refund confirm uses same delete/cancel mutation */
  isRefunding?: boolean;
  onBack: () => void;
  onUpdateOrder: () => void;
  onCreateInvoice: () => void;
  onCancelClick: () => void;
  /** Fully paid — opens Process Refund confirm (store + admin) */
  onRefundClick?: () => void;
};

export function OrderDetailActionBar({
  order,
  dataLoading,
  invoiceHrefBase,
  mode: _mode,
  disableOrderActions,
  isSupplierRole = false,
  isCancelling,
  isRefunding = false,
  onBack,
  onUpdateOrder,
  onCreateInvoice,
  onCancelClick,
  onRefundClick,
}: OrderDetailActionBarProps) {
  void _mode; // Call sites still pass store|admin for clarity; gates are paymentStatus-based (REQ-0209)
  const actionsDisabled = dataLoading || !order || disableOrderActions;
  const isCancelled = order?.status === "cancelled";
  const isFullyPaid = order?.paymentStatus === "paid";
  const isUnpaidOrPartial =
    !!order &&
    (order.paymentStatus === "unpaid" ||
      order.paymentStatus === "partial" ||
      // Legacy / missing → Cancel (unpaid path)
      !order.paymentStatus);
  // REQ-0211 — shared canGenerateShippingLabel (admin card + API same rule)
  const canShip = canGenerateShippingLabel(order);
  const payAmount = order ? resolveOrderPayAmount(order) : 0;
  const canPay =
    !!order &&
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refunded" &&
    !isCancelled &&
    payAmount > 0;
  // REQ-0209 — unpaid|partial → Cancel Order; fully paid → Process Refund (both modes)
  const showCancel = !!order && !isCancelled && isUnpaidOrPartial;
  const showRefund =
    !!order &&
    !isCancelled &&
    isFullyPaid &&
    typeof onRefundClick === "function";

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
      <Button
        onClick={onBack}
        className={glassDetailBackButtonClass("w-full sm:w-auto gap-2")}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        Back
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button
              onClick={onUpdateOrder}
              // REQ-0210 — cancelled/refunded orders are read-only
              disabled={actionsDisabled || isCancelled}
              className={glassDetailFooterButtonClass("blue")}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Update Order
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {isCancelled
            ? "Cancelled orders cannot be updated."
            : disableOrderActions
              ? "Only the admin who owns the order can update it."
              : "Edit order details."}
        </TooltipContent>
      </Tooltip>

      {/* View when linked; Create when absent (REQ-0061) */}
      {!dataLoading && order && order.invoiceForOrder ? (
        <Button asChild className={glassDetailFooterButtonClass("indigo")}>
          <Link href={`${invoiceHrefBase}/${order.invoiceForOrder.id}`}>
            <FileText className="h-4 w-4 shrink-0" />
            View Invoice
          </Link>
        </Button>
      ) : (
        !dataLoading &&
        order &&
        !isCancelled &&
        !disableOrderActions && (
          <Button
            onClick={onCreateInvoice}
            className={glassDetailFooterButtonClass("indigo")}
          >
            <FilePlus2 className="h-4 w-4 shrink-0" />
            Create Invoice
          </Button>
        )
      )}

      {canPay && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <PaymentDialog
                type="order"
                id={order!.id}
                referenceNumber={order!.orderNumber}
                amount={payAmount}
                amountPaid={
                  order!.invoiceForOrder?.amountPaid != null
                    ? Number(order!.invoiceForOrder.amountPaid)
                    : undefined
                }
                documentTotal={order!.total}
                subtotal={order!.subtotal}
                items={order!.items.map((item) => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: item.subtotal,
                  imageUrl: item.imageUrl,
                }))}
                tax={order!.tax ?? undefined}
                shipping={order!.shipping ?? undefined}
                discount={order!.discount ?? undefined}
                disabled={isSupplierRole}
                trigger={
                  <Button
                    disabled={isSupplierRole}
                    className={glassDetailFooterButtonClass("emerald")}
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    Pay ${payAmount.toFixed(2)}
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

      {canShip && (
        <ShippingManagement
          order={order!}
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

      {!dataLoading && showCancel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <DialogSubmitButton
                type="button"
                onClick={onCancelClick}
                isPending={isCancelling}
                pendingLabel="Cancelling…"
                label="Cancel Order"
                icon={Ban}
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

      {!dataLoading && showRefund && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <DialogSubmitButton
                type="button"
                onClick={onRefundClick}
                isPending={isRefunding}
                pendingLabel="Processing…"
                label="Process Refund"
                icon={RefreshCw}
                hue="rose"
                disabled={dataLoading || !order || isRefunding}
                className="group w-full sm:w-auto gap-2"
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            Cancel the order and issue a full refund via Stripe. Stock will be
            restored and the linked invoice cancelled.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
