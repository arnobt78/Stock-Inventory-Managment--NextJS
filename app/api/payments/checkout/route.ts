/**
 * Stripe Checkout API Route
 * POST /api/payments/checkout — create a Stripe Checkout session
 * REQ-0152 — optional amount (partial pay); admin can checkout; no unpaid clobber.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/prisma/client";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import {
  createCheckoutBodySchema,
  validateCheckoutChargeAmount,
} from "@/lib/validations/payment";
import { scheduleInvalidateOrderGraphCaches } from "@/lib/cache";
import type { CheckoutSessionResponse } from "@/types";

/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout session for an order or invoice
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payment system is not configured" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const validationResult = createCheckoutBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid checkout data", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { type, id, amount: requestedAmount, successUrl, cancelUrl } =
      validationResult.data;

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let lineItems: {
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];
    const metadata: Record<string, string> = {
      type,
      referenceId: id,
      userId: session.id,
    };
    let customerEmail: string | undefined;
    let remainingDue = 0;
    let chargeAmount = 0;

    if (type === "order") {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, invoice: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const isAdmin = session.role === "admin";
      const isClient = session.role === "client";
      const isCreator = order.userId === session.id;
      const isOrderClient = order.clientId === session.id;
      const canCheckout =
        isAdmin || isCreator || (isClient && isOrderClient);

      if (!canCheckout) {
        return NextResponse.json(
          {
            error:
              "Only an admin, the order creator, or the assigned client can complete payment for this order.",
          },
          { status: 403 },
        );
      }

      if (order.paymentStatus === "paid") {
        return NextResponse.json(
          { error: "Order is already paid" },
          { status: 400 },
        );
      }

      // Remaining = linked invoice amountDue, else full order total
      remainingDue =
        order.invoice != null
          ? Math.max(0, order.invoice.amountDue)
          : Math.max(0, order.total);

      if (remainingDue <= 0) {
        return NextResponse.json(
          { error: "Nothing left to pay on this order" },
          { status: 400 },
        );
      }

      chargeAmount =
        requestedAmount !== undefined ? requestedAmount : remainingDue;
      const amountError = validateCheckoutChargeAmount(
        chargeAmount,
        remainingDue,
      );
      if (amountError) {
        return NextResponse.json({ error: amountError }, { status: 400 });
      }

      const chargeCents = Math.round(chargeAmount * 100);
      const isPartial = Math.round(chargeAmount * 100) < Math.round(remainingDue * 100);
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Order ${order.orderNumber}`,
              description: isPartial
                ? `Partial payment $${chargeAmount.toFixed(2)} of $${order.total.toFixed(2)}`
                : `Payment for order ${order.orderNumber}`,
            },
            unit_amount: chargeCents,
          },
          quantity: 1,
        },
      ];

      metadata.orderNumber = order.orderNumber;
      metadata.orderId = order.id;
      metadata.chargeAmount = chargeAmount.toFixed(2);
      metadata.isPartial = isPartial ? "true" : "false";

      if (order.clientId) {
        const client = await prisma.user.findUnique({
          where: { id: order.clientId },
          select: { email: true },
        });
        customerEmail = client?.email;
      }
    } else if (type === "invoice") {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 },
        );
      }

      const isAdmin = session.role === "admin";
      const isClient = session.role === "client";
      const isCreator = invoice.userId === session.id;
      const isInvoiceClient = invoice.clientId === session.id;
      const canCheckout =
        isAdmin || isCreator || (isClient && isInvoiceClient);

      if (!canCheckout) {
        return NextResponse.json(
          {
            error:
              "Only an admin, the invoice creator, or the assigned client can complete payment for this invoice.",
          },
          { status: 403 },
        );
      }

      if (invoice.status === "paid") {
        return NextResponse.json(
          { error: "Invoice is already paid" },
          { status: 400 },
        );
      }

      if (invoice.status === "cancelled") {
        return NextResponse.json(
          { error: "Cancelled invoices cannot be paid" },
          { status: 400 },
        );
      }

      remainingDue = Math.max(0, invoice.amountDue);
      if (remainingDue <= 0) {
        return NextResponse.json(
          { error: "Nothing left to pay on this invoice" },
          { status: 400 },
        );
      }

      chargeAmount =
        requestedAmount !== undefined ? requestedAmount : remainingDue;
      const amountError = validateCheckoutChargeAmount(
        chargeAmount,
        remainingDue,
      );
      if (amountError) {
        return NextResponse.json({ error: amountError }, { status: 400 });
      }

      const chargeCents = Math.round(chargeAmount * 100);
      const isPartial =
        Math.round(chargeAmount * 100) < Math.round(remainingDue * 100);
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: isPartial
                ? `Partial payment $${chargeAmount.toFixed(2)} (due $${remainingDue.toFixed(2)})`
                : `Payment for invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: chargeCents,
          },
          quantity: 1,
        },
      ];

      metadata.invoiceNumber = invoice.invoiceNumber;
      metadata.invoiceId = invoice.id;
      metadata.chargeAmount = chargeAmount.toFixed(2);
      metadata.isPartial = isPartial ? "true" : "false";

      if (invoice.clientId) {
        const client = await prisma.user.findUnique({
          where: { id: invoice.clientId },
          select: { email: true },
        });
        customerEmail = client?.email;
      }
    } else {
      return NextResponse.json(
        { error: "Invalid checkout type" },
        { status: 400 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata,
      customer_email: customerEmail,
      success_url:
        successUrl ||
        `${baseUrl}/${type}s/${id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/${type}s/${id}?payment=cancelled`,
    });

    // REQ-0152 — store payment link only; never clobber order paymentStatus to unpaid
    if (type === "invoice" && checkoutSession.url) {
      await prisma.invoice.update({
        where: { id },
        data: {
          paymentLink: checkoutSession.url,
          updatedAt: new Date(),
        },
      });
    }
    await scheduleInvalidateOrderGraphCaches();
    const response: CheckoutSessionResponse = {
      sessionId: checkoutSession.id,
      url: checkoutSession.url!,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 },
    );
  }
}
