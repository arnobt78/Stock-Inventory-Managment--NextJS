"use client";

/**
 * Payment Dialog Component
 * Modal dialog for Stripe payment with test credentials display
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCreateCheckout } from "@/hooks/queries";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import TestCredentialsCard from "./TestCredentialsCard";
import type { CheckoutType } from "@/types";

interface PaymentDialogProps {
  type: CheckoutType;
  id: string;
  referenceNumber: string;
  amount: number;
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
  }>;
  /** Optional: show above Total when present */
  tax?: number | null;
  /** Optional: show above Total when present */
  shipping?: number | null;
  /** Optional: show above Total when present (displayed as discount) */
  discount?: number | null;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export default function PaymentDialog({
  type,
  id,
  referenceNumber,
  amount,
  items,
  tax,
  shipping,
  discount,
  disabled,
  trigger,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const checkoutMutation = useCreateCheckout();

  const handlePayment = () => {
    checkoutMutation.mutate({ type, id });
  };

  const isLoading = checkoutMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button disabled={disabled}>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${amount.toFixed(2)}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="poppins max-h-[90vh] flex flex-col overflow-hidden pl-4 sm:pl-8 pt-4 sm:pt-7 pb-4 sm:pb-7 pr-0 border-sky-400/30 dark:border-sky-400/30 shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]">
        <DialogHeader className="flex-shrink-0 .5 pr-4 sm:pr-8">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
            Complete Payment
            <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
          </DialogTitle>
          <DialogDescription className="text-sm text-white/80">
            Secure payment powered by Stripe
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:gap-4 overflow-y-auto min-h-0 flex-1 w-full">
          <div className="pr-4 sm:pr-8 flex flex-col gap-2 sm:gap-4">
            {/* Order/Invoice Summary */}
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
                      <span className="flex items-center gap-2 min-w-0">
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
                  <span className="text-white">
                    {type === "order" ? "Order" : "Invoice"} #{referenceNumber}
                  </span>
                </div>
              )}

              {(tax != null && tax > 0) ||
              (shipping != null && shipping > 0) ||
              (discount != null && discount > 0) ? (
                <>
                  <Separator className="my-3" />
                  <div className=".5 text-sm">
                    {tax != null && tax > 0 && (
                      <div className="flex items-center justify-between text-white">
                        <span>Tax</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                    )}
                    {shipping != null && shipping > 0 && (
                      <div className="flex items-center justify-between text-white">
                        <span>Shipping</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                    )}
                    {discount != null && discount > 0 && (
                      <div className="flex items-center justify-between text-white">
                        <span>Discount</span>
                        <span className="text-emerald-400">
                          -${discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              <Separator className="my-3" />

              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-white">Total</span>
                <span className="text-sm sm:text-lg font-medium text-white">
                  ${amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Test Credentials */}
            <div className="flex-shrink-0">
              <TestCredentialsCard />
            </div>

            {/* Pay Button */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <p className="text-xs text-center text-white/80">
                No card entry here — you&apos;ll enter payment details on
                Stripe&apos;s page after clicking below.
              </p>
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] dark:shadow-[0_15px_35px_rgba(2,132,199,0.25)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 dark:hover:border-sky-300/40 dark:hover:from-sky-500/80 dark:hover:via-sky-500/60 dark:hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)] dark:hover:shadow-[0_20px_45px_rgba(2,132,199,0.35)] focus-visible:ring-sky-500/50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Secure checkout with Link
                  </>
                )}
              </Button>

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
