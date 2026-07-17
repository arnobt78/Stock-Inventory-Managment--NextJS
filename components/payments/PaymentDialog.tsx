"use client";

/**
 * Payment Dialog — Stripe checkout entry (REQ-0152).
 * Default: pay full remaining (readonly). Toggle: pay partially (editable + Zod hint).
 */

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCreateCheckout } from "@/hooks/queries";
import {
  CreditCard,
  X,
  Receipt,
  Percent,
  Truck,
  Tag,
  CircleDollarSign,
} from "lucide-react";
import TestCredentialsCard from "./TestCredentialsCard";
import type { CheckoutType } from "@/types";
import { cn } from "@/lib/utils";
import {
  CopyableText,
  DIALOG_EDGE_SCROLL_HEADER,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { DIALOG_FORM_FIELD_SKY } from "@/components/shared/dialog-form-field";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { InvoiceSummaryRow } from "@/components/invoices/detail/InvoiceSummaryCard";
import { validateCheckoutChargeAmount } from "@/lib/validations/payment";

interface PaymentDialogProps {
  type: CheckoutType;
  id: string;
  referenceNumber: string;
  /** Remaining amount due (chargeable balance). */
  amount: number;
  /** Already paid toward total (optional summary). */
  amountPaid?: number | null;
  /** Document total before payments (optional summary). */
  documentTotal?: number | null;
  /** Line subtotal before tax/shipping/discount (REQ-0126) */
  subtotal?: number | null;
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
    imageUrl?: string | null;
  }>;
  tax?: number | null;
  shipping?: number | null;
  discount?: number | null;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export default function PaymentDialog({
  type,
  id,
  referenceNumber,
  amount,
  amountPaid = 0,
  documentTotal,
  subtotal,
  items,
  tax,
  shipping,
  discount,
  disabled,
  trigger,
}: PaymentDialogProps) {
  const remainingDue = Math.max(0, amount);
  const [open, setOpen] = useState(false);
  /** false = pay full (default); true = partial */
  const [payPartial, setPayPartial] = useState(false);
  const [partialInput, setPartialInput] = useState(() =>
    Math.max(0, amount).toFixed(2),
  );
  const checkoutMutation = useCreateCheckout();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Reset to pay-full when opening (avoid setState-in-effect lint)
    if (next) {
      setPayPartial(false);
      setPartialInput(remainingDue.toFixed(2));
    }
  };

  const chargeAmount = useMemo(() => {
    if (!payPartial) return remainingDue;
    const parsed = Number.parseFloat(partialInput);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [payPartial, partialInput, remainingDue]);

  const amountError = useMemo(() => {
    if (!payPartial) return null;
    if (partialInput.trim() === "") return "Enter a payment amount";
    return validateCheckoutChargeAmount(chargeAmount, remainingDue);
  }, [payPartial, partialInput, chargeAmount, remainingDue]);

  const canSubmit =
    !disabled &&
    remainingDue > 0 &&
    !amountError &&
    Number.isFinite(chargeAmount) &&
    chargeAmount > 0;

  const handlePayment = () => {
    if (!canSubmit) return;
    checkoutMutation.mutate({
      type,
      id,
      amount: Number(chargeAmount.toFixed(2)),
    });
  };

  const isLoading = checkoutMutation.isPending;
  const displaySubtotal =
    subtotal ??
    (items?.reduce((sum, item) => sum + item.price, 0) || remainingDue);
  const displayTotal =
    documentTotal != null && documentTotal > 0 ? documentTotal : remainingDue;
  const paidSoFar = amountPaid != null && amountPaid > 0 ? amountPaid : 0;

  const hasFeeRows =
    (tax != null && tax > 0) ||
    (shipping != null && shipping > 0) ||
    (discount != null && discount > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button disabled={disabled}>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${remainingDue.toFixed(2)}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="poppins max-h-[90vh] flex flex-col overflow-hidden pl-4 sm:pl-8 pt-4 sm:pt-7 pb-4 sm:pb-7 pr-0 border-sky-400/30 dark:border-sky-400/30 shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]">
        <DialogHeaderBrand
          className={DIALOG_EDGE_SCROLL_HEADER}
          icon={CreditCard}
          tone="sky"
          title="Complete Payment"
          description="Secure payment powered by Stripe"
        />

        <div className="flex flex-col gap-2 sm:gap-4 overflow-y-auto min-h-0 flex-1 w-full">
          <div className="pr-4 sm:pr-8 flex flex-col gap-2 sm:gap-4">
            <div className="rounded-lg border border-sky-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 space-y-2 flex-shrink-0 shadow-[0_10px_30px_rgba(2,132,199,0.15)] dark:shadow-[0_10px_30px_rgba(2,132,199,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {type === "order" ? "Order" : "Invoice"} Summary
                </span>
                {items?.length != null && (
                  <span className="text-sm text-white">
                    Items ({items.length})
                  </span>
                )}
              </div>

              {items && items.length > 0 ? (
                <div className="space-y-2">
                  {items.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm gap-2"
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <ProductThumb
                          name={item.name}
                          imageUrl={item.imageUrl}
                          size="sm"
                          className="border-sky-400/30"
                        />
                        {item.quantity != null && (
                          <span className="px-1 py-0.5 rounded bg-primary/10 text-white text-xs font-medium shrink-0">
                            {item.quantity}
                          </span>
                        )}
                        <span className="text-white truncate">{item.name}</span>
                      </span>
                      <span className="font-medium text-white shrink-0">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {items.length > 5 && (
                    <p className="text-xs text-white/80 pt-1">
                      + {items.length - 5} more items...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <CopyableText value={referenceNumber} className="text-white">
                    {type === "order" ? "Order" : "Invoice"} #{referenceNumber}
                  </CopyableText>
                </div>
              )}

              <Separator className="my-3 bg-sky-400/20" />

              <div className="space-y-1">
                <InvoiceSummaryRow
                  icon={Receipt}
                  label="Subtotal:"
                  value={`$${displaySubtotal.toFixed(2)}`}
                  variant="glass"
                />
                {tax != null && tax > 0 && (
                  <InvoiceSummaryRow
                    icon={Percent}
                    label="Tax:"
                    value={`$${tax.toFixed(2)}`}
                    variant="glass"
                  />
                )}
                {shipping != null && shipping > 0 && (
                  <InvoiceSummaryRow
                    icon={Truck}
                    label="Shipping:"
                    value={`$${shipping.toFixed(2)}`}
                    variant="glass"
                  />
                )}
                {discount != null && discount > 0 && (
                  <InvoiceSummaryRow
                    icon={Tag}
                    label="Discount:"
                    value={`-$${discount.toFixed(2)}`}
                    valueClassName="text-emerald-400"
                    variant="glass"
                  />
                )}
                {paidSoFar > 0 && (
                  <InvoiceSummaryRow
                    icon={CircleDollarSign}
                    label="Already paid:"
                    value={`$${paidSoFar.toFixed(2)}`}
                    valueClassName="text-emerald-400"
                    variant="glass"
                  />
                )}
              </div>

              {hasFeeRows && <Separator className="my-2 bg-sky-400/20" />}

              <div className="flex items-center justify-between pt-1 text-sm sm:text-lg font-medium">
                <span className="text-white inline-flex items-center gap-1.5">
                  <CircleDollarSign className="h-4 w-4 shrink-0" />
                  {paidSoFar > 0 ? "Amount due" : "Total"}
                </span>
                <span className="text-white">
                  ${remainingDue.toFixed(2)}
                  {paidSoFar > 0 && displayTotal > 0 ? (
                    <span className="ml-1 text-xs font-normal text-white/70">
                      / ${displayTotal.toFixed(2)}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {/* REQ-0152 — full vs partial charge */}
            <div className="rounded-lg border border-sky-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label
                    htmlFor="pay-partial-toggle"
                    className="text-sm font-medium text-white"
                  >
                    Pay partially
                  </Label>
                  <p className="text-xs text-white/70 mt-0.5">
                    Off = pay full remaining (${remainingDue.toFixed(2)})
                  </p>
                </div>
                <Switch
                  id="pay-partial-toggle"
                  checked={payPartial}
                  onCheckedChange={(checked) => {
                    setPayPartial(checked);
                    if (checked) {
                      setPartialInput("");
                    } else {
                      setPartialInput(remainingDue.toFixed(2));
                    }
                  }}
                  disabled={disabled || remainingDue <= 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="checkout-amount"
                  className="text-xs text-white/80"
                >
                  Amount to charge
                </Label>
                <Input
                  id="checkout-amount"
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  max={remainingDue}
                  step="0.01"
                  readOnly={!payPartial}
                  value={
                    payPartial ? partialInput : remainingDue.toFixed(2)
                  }
                  onChange={(e) => setPartialInput(e.target.value)}
                  className={cn(
                    DIALOG_FORM_FIELD_SKY,
                    !payPartial && "opacity-80 cursor-not-allowed",
                  )}
                  aria-invalid={!!amountError}
                />
                {amountError ? (
                  <p className="text-xs text-rose-300" role="alert">
                    {amountError}
                  </p>
                ) : (
                  <p className="text-xs text-white/60">
                    {payPartial
                      ? `Enter any amount up to $${remainingDue.toFixed(2)}`
                      : "Full remaining balance will be charged"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <TestCredentialsCard />
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <p className="text-xs text-center text-white/80">
                No card entry here — you&apos;ll enter payment details on
                Stripe&apos;s page after clicking below.
              </p>
              <DialogFooter className="flex flex-col sm:flex-row items-center gap-2 sm:justify-center">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading}
                    className={cn(
                      "w-full sm:w-auto px-11 gap-2",
                      GLASS_GHOST_BUTTON,
                    )}
                  >
                    <X className="h-4 w-4 shrink-0" aria-hidden />
                    Cancel
                  </Button>
                </DialogClose>
                <DialogSubmitButton
                  type="button"
                  onClick={handlePayment}
                  isPending={isLoading}
                  disabled={!canSubmit}
                  pendingLabel="Redirecting to payment…"
                  label={
                    Number.isFinite(chargeAmount) && chargeAmount > 0
                      ? `Pay $${chargeAmount.toFixed(2)}`
                      : "Secure checkout with Link"
                  }
                  icon={CreditCard}
                  hue="sky"
                  className="px-11"
                />
              </DialogFooter>

              <p className="text-xs text-center text-white">
                You&apos;ll be redirected to Stripe&apos;s secure checkout page
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
