/**
 * Stripe Checkout API Route
 * POST /api/payments/checkout — create a Stripe Checkout session
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/prisma/client";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createCheckoutBodySchema } from "@/lib/validations/payment";
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

    const { type, id, successUrl, cancelUrl } = validationResult.data;

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

    if (type === "order") {
      // Fetch order by id first, then enforce who can checkout (creator or client only)
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const isClient = session.role === "client";
      const isCreator = order.userId === session.id;
      const isOrderClient = order.clientId === session.id;
      const canCheckout =
        isCreator || (isClient && isOrderClient);

      if (!canCheckout) {
        return NextResponse.json(
          {
            error:
              "Only the order creator or the assigned client can complete payment for this order.",
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

      // Stripe requires unit_amount to be a non-negative integer, so we cannot send a negative "Discount" line.
      // When there is a discount, use a single line item with the order total; otherwise itemize.
      if (order.discount && order.discount > 0) {
        const totalCents = Math.round(order.total * 100);
        if (totalCents < 0) {
          return NextResponse.json(
            { error: "Order total cannot be negative" },
            { status: 400 },
          );
        }
        const parts: string[] = [];
        if (order.subtotal) parts.push(`Subtotal $${order.subtotal.toFixed(2)}`);
        if (order.tax && order.tax > 0) parts.push(`Tax $${order.tax.toFixed(2)}`);
        if (order.shipping && order.shipping > 0)
          parts.push(`Shipping $${order.shipping.toFixed(2)}`);
        parts.push(`Discount -$${order.discount.toFixed(2)}`);
        lineItems = [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Order ${order.orderNumber}`,
                description: parts.join(" · ") + ` → Total $${order.total.toFixed(2)}`,
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ];
      } else {
        lineItems = order.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.productName,
              description: item.sku ? `SKU: ${item.sku}` : undefined,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }));
        if (order.tax && order.tax > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: { name: "Tax" },
              unit_amount: Math.round(order.tax * 100),
            },
            quantity: 1,
          });
        }
        if (order.shipping && order.shipping > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: { name: "Shipping" },
              unit_amount: Math.round(order.shipping * 100),
            },
            quantity: 1,
          });
        }
      }

      metadata.orderNumber = order.orderNumber;
      metadata.orderId = order.id;

      // Get client email if available
      if (order.clientId) {
        const client = await prisma.user.findUnique({
          where: { id: order.clientId },
          select: { email: true },
        });
        customerEmail = client?.email;
      }
    } else if (type === "invoice") {
      // Fetch invoice by id, then enforce who can pay (creator or client only)
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          order: { include: { items: true } },
        },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 },
        );
      }

      const isClient = session.role === "client";
      const isCreator = invoice.userId === session.id;
      const isInvoiceClient = invoice.clientId === session.id;
      const canCheckout =
        isCreator || (isClient && isInvoiceClient);

      if (!canCheckout) {
        return NextResponse.json(
          {
            error:
              "Only the invoice creator or the assigned client can complete payment for this invoice.",
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

      // Use invoice amount due
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment for invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(invoice.amountDue * 100),
          },
          quantity: 1,
        },
      ];

      metadata.invoiceNumber = invoice.invoiceNumber;
      metadata.invoiceId = invoice.id;

      // Get client email if available
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

    // Create Stripe Checkout session
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

    // Update order/invoice with payment link
    if (type === "order" && checkoutSession.url) {
      await prisma.order.update({
        where: { id },
        data: {
          paymentStatus: "unpaid",
          updatedAt: new Date(),
        },
      });
    } else if (type === "invoice" && checkoutSession.url) {
      await prisma.invoice.update({
        where: { id },
        data: {
          paymentLink: checkoutSession.url,
          updatedAt: new Date(),
        },
      });
    }
    scheduleInvalidateOrderGraphCaches();
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
