/**
 * REQ-0209 gap — Apply Stripe Checkout Session on browser return (`?payment=success&session_id=`).
 * Idempotent vs webhook: if PaymentIntent already stored, only re-run payment→status sync
 * (confirms Pending→Confirmed on first money when webhook used older logic or remote webhook).
 */

import { getStripe } from "@/lib/stripe";
import { prisma } from "@/prisma/client";
import { applyStripeChargeToOrderInvoice } from "@/prisma/invoice";
import {
  applyIncrementalInvoicePayment,
  syncOrderPaymentStatusFromInvoice,
} from "@/lib/payments/order-payment-from-amounts";
import { healInvoiceStatusAfterMoney } from "@/lib/invoices/heal-invoice-status-after-money";
import { invalidateOnOrderChange } from "@/lib/cache";
import { logger } from "@/lib/logger";

export type ConfirmCheckoutSessionResult = {
  ok: boolean;
  alreadyApplied: boolean;
  orderId?: string;
  invoiceId?: string;
  paymentStatus?: string | null;
  orderStatus?: string | null;
  error?: string;
};

/**
 * Retrieve Checkout Session and sync order/invoice money + fulfillment status.
 */
export async function confirmCheckoutSessionById(
  sessionId: string,
): Promise<ConfirmCheckoutSessionResult> {
  if (!sessionId.startsWith("cs_")) {
    return { ok: false, alreadyApplied: false, error: "Invalid session id" };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return {
      ok: false,
      alreadyApplied: false,
      error: `Session not paid (${session.payment_status})`,
    };
  }

  const metadata = session.metadata ?? {};
  const type = metadata.type;
  const referenceId = metadata.referenceId;
  const orderIdMeta = metadata.orderId;
  const invoiceIdMeta = metadata.invoiceId;
  const sessionAmount = session.amount_total ? session.amount_total / 100 : 0;
  const metaCharge = metadata.chargeAmount
    ? Number.parseFloat(metadata.chargeAmount)
    : NaN;
  const chargeAmount =
    Number.isFinite(metaCharge) && metaCharge > 0 ? metaCharge : sessionAmount;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (type === "order" && (orderIdMeta || referenceId)) {
    const orderId = orderIdMeta || referenceId!;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        stripePaymentIntentId: true,
      },
    });
    if (!order) {
      return { ok: false, alreadyApplied: false, error: "Order not found" };
    }

    const alreadyApplied =
      !!paymentIntentId &&
      order.stripePaymentIntentId === paymentIntentId;

    if (!alreadyApplied) {
      const invoice = await applyStripeChargeToOrderInvoice(
        orderId,
        chargeAmount,
      );
      if (paymentIntentId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            stripePaymentIntentId: paymentIntentId,
            updatedAt: new Date(),
          },
        });
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            stripePaymentIntentId: paymentIntentId,
            updatedAt: new Date(),
          },
        });
      }
      await syncOrderPaymentStatusFromInvoice(orderId, {
        amountPaid: invoice.amountPaid,
        total: invoice.total,
        invoiceStatus: invoice.status,
      });
    } else {
      // Webhook already applied money — heal draft→sent + sync Pending→Confirmed
      const existing = await prisma.invoice.findUnique({
        where: { orderId },
        select: { id: true },
      });
      if (existing) {
        const invoice = await healInvoiceStatusAfterMoney(existing.id);
        if (invoice) {
          await syncOrderPaymentStatusFromInvoice(orderId, {
            amountPaid: invoice.amountPaid,
            total: invoice.total,
            invoiceStatus: invoice.status,
          });
        }
      }
    }

    await invalidateOnOrderChange();
    const refreshed = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentStatus: true },
    });

    return {
      ok: true,
      alreadyApplied,
      orderId,
      paymentStatus: refreshed?.paymentStatus ?? null,
      orderStatus: refreshed?.status ?? null,
    };
  }

  if (type === "invoice" && (invoiceIdMeta || referenceId)) {
    const invoiceId = invoiceIdMeta || referenceId!;
    const prior = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!prior) {
      return { ok: false, alreadyApplied: false, error: "Invoice not found" };
    }

    const alreadyApplied =
      !!paymentIntentId &&
      prior.stripePaymentIntentId === paymentIntentId;

    if (!alreadyApplied) {
      const next = applyIncrementalInvoicePayment({
        priorAmountPaid: prior.amountPaid,
        total: prior.total,
        chargeAmount,
        priorStatus: prior.status,
      });
      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: next.status,
          amountPaid: next.amountPaid,
          amountDue: next.amountDue,
          paidAt: next.fullyPaid ? new Date() : null,
          stripePaymentIntentId: paymentIntentId ?? undefined,
          updatedAt: new Date(),
        },
      });
      await syncOrderPaymentStatusFromInvoice(updated.orderId, {
        amountPaid: updated.amountPaid,
        total: updated.total,
        invoiceStatus: updated.status,
      });
      await invalidateOnOrderChange();
      const refreshed = updated.orderId
        ? await prisma.order.findUnique({
            where: { id: updated.orderId },
            select: { status: true, paymentStatus: true },
          })
        : null;
      return {
        ok: true,
        alreadyApplied: false,
        invoiceId,
        orderId: updated.orderId,
        paymentStatus: refreshed?.paymentStatus ?? null,
        orderStatus: refreshed?.status ?? null,
      };
    }

    // alreadyApplied — still heal draft→sent when money is present
    const healed = await healInvoiceStatusAfterMoney(invoiceId);
    if (healed) {
      await syncOrderPaymentStatusFromInvoice(healed.orderId, {
        amountPaid: healed.amountPaid,
        total: healed.total,
        invoiceStatus: healed.status,
      });
    }
    await invalidateOnOrderChange();
    const refreshed = (healed?.orderId ?? prior.orderId)
      ? await prisma.order.findUnique({
          where: { id: healed?.orderId ?? prior.orderId },
          select: { status: true, paymentStatus: true },
        })
      : null;
    return {
      ok: true,
      alreadyApplied: true,
      invoiceId,
      orderId: healed?.orderId ?? prior.orderId,
      paymentStatus: refreshed?.paymentStatus ?? null,
      orderStatus: refreshed?.status ?? null,
    };
  }

  logger.warn("confirmCheckoutSession: unknown session type", {
    type,
    sessionId,
  });
  return { ok: false, alreadyApplied: false, error: "Unknown checkout type" };
}
