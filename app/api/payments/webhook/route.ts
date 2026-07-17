/**
 * Stripe Webhook Handler
 * POST /api/payments/webhook — handle Stripe webhook events
 * REQ-0152 — incremental amountPaid; sync order unpaid|partial|paid; fulfill only on full pay.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  getStripe,
  getWebhookSecret,
  isStripeConfigured,
  Stripe,
} from "@/lib/stripe";
import { prisma } from "@/prisma/client";
import { applyStripeChargeToOrderInvoice } from "@/prisma/invoice";
import {
  applyIncrementalInvoicePayment,
  syncOrderPaymentStatusFromInvoice,
} from "@/lib/payments/order-payment-from-amounts";

import { invalidateOnOrderChange } from "@/lib/cache";

export const runtime = "nodejs";

/**
 * POST /api/payments/webhook
 * Handles Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      logger.warn("Stripe webhook received but Stripe is not configured");
      return NextResponse.json(
        { error: "Payment system is not configured" },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      logger.error("Missing Stripe signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    logger.info(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.info(`PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

/**
 * Handle successful checkout completion (full or partial charge).
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) {
    logger.warn("Checkout session has no metadata");
    return;
  }

  const { type, referenceId, orderId, invoiceId } = metadata;
  const sessionAmount = session.amount_total ? session.amount_total / 100 : 0;
  const metaCharge = metadata.chargeAmount
    ? Number.parseFloat(metadata.chargeAmount)
    : NaN;
  const chargeAmount =
    Number.isFinite(metaCharge) && metaCharge > 0 ? metaCharge : sessionAmount;

  logger.info(
    `Checkout completed for ${type} ${referenceId || orderId || invoiceId} charge=$${chargeAmount}`,
  );

  if (type === "order" && (orderId || referenceId)) {
    const orderIdToUpdate = orderId || referenceId;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    try {
      const invoice = await applyStripeChargeToOrderInvoice(
        orderIdToUpdate!,
        chargeAmount,
      );

      if (paymentIntentId) {
        await prisma.order.update({
          where: { id: orderIdToUpdate },
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

      await syncOrderPaymentStatusFromInvoice(orderIdToUpdate, {
        amountPaid: invoice.amountPaid,
        total: invoice.total,
        invoiceStatus: invoice.status,
      });

      await invalidateOnOrderChange();
      logger.info(
        `Order ${orderIdToUpdate} payment synced (${invoice.status}, paid=${invoice.amountPaid}, due=${invoice.amountDue})`,
      );
    } catch (err) {
      logger.error("Failed to apply Stripe charge to order invoice", {
        orderId: orderIdToUpdate,
        error: err,
      });
      throw err;
    }
  } else if (type === "invoice" && (invoiceId || referenceId)) {
    const invoiceIdToUpdate = invoiceId || referenceId;

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const prior = await prisma.invoice.findUnique({
      where: { id: invoiceIdToUpdate },
    });
    if (!prior) {
      logger.error(`Invoice ${invoiceIdToUpdate} not found for webhook`);
      return;
    }

    const next = applyIncrementalInvoicePayment({
      priorAmountPaid: prior.amountPaid,
      total: prior.total,
      chargeAmount,
      priorStatus: prior.status,
    });

    const updated = await prisma.invoice.update({
      where: { id: invoiceIdToUpdate },
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
    logger.info(
      `Invoice ${invoiceIdToUpdate} payment synced (${updated.status}, paid=${updated.amountPaid}, due=${updated.amountDue})`,
    );
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) return;

  const { type, orderId, invoiceId, referenceId } = metadata;

  logger.info(
    `Checkout expired for ${type} ${referenceId || orderId || invoiceId}`,
  );
}

/**
 * Handle charge refund (e.g. when refunded from Stripe Dashboard)
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logger.warn("Charge refunded but no payment_intent on charge");
    return;
  }

  logger.info(
    `Charge refunded: ${charge.id}, PaymentIntent: ${paymentIntentId}`,
  );

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { items: true, invoice: true },
  });
  if (order && order.paymentStatus !== "refunded") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "refunded",
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    if (order.invoice && order.invoice.status !== "cancelled") {
      await prisma.invoice.update({
        where: { id: order.invoice.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          amountDue: 0,
          updatedAt: new Date(),
        },
      });
    }
    logger.info(`Order ${order.id} marked refunded from charge.refunded`);
  }

  const invoiceRecord = await prisma.invoice.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { order: { include: { items: true } } },
  });
  if (invoiceRecord && invoiceRecord.status !== "cancelled") {
    await prisma.invoice.update({
      where: { id: invoiceRecord.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        amountDue: 0,
        updatedAt: new Date(),
      },
    });
    if (invoiceRecord.order && invoiceRecord.order.paymentStatus !== "refunded") {
      await prisma.order.update({
        where: { id: invoiceRecord.order.id },
        data: {
          paymentStatus: "refunded",
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      });
      for (const item of invoiceRecord.order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }
    logger.info(
      `Invoice ${invoiceRecord.id} marked cancelled from charge.refunded`,
    );
  }

  if (order || invoiceRecord) {
    await invalidateOnOrderChange();
  }
}
