/**
 * Stripe Webhook Handler
 * POST /api/payments/webhook — handle Stripe webhook events
 * REQ-0152 / REQ-0209 — incremental amountPaid; sync unpaid|partial|paid;
 * first money confirms + fulfills. Browser return also calls confirm-session (localhost without local webhook).
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
import { confirmCheckoutSessionById } from "@/lib/payments/confirm-checkout-session";
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
        // REQ-0209 — same idempotent path as browser confirm-session (safe if both fire)
        if (session.id) {
          const result = await confirmCheckoutSessionById(session.id);
          if (!result.ok) {
            logger.warn("Webhook confirm-session failed", {
              error: result.error,
              sessionId: session.id,
            });
            throw new Error(result.error ?? "confirm-session failed");
          }
          logger.info(
            `Checkout completed synced order=${result.orderId} status=${result.orderStatus} pay=${result.paymentStatus} alreadyApplied=${result.alreadyApplied}`,
          );
        }
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
