/**
 * Send Invoice Email API Route
 * Handles sending invoice via email
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getInvoiceById, markInvoiceAsSent } from "@/prisma/invoice";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { sendInvoiceEmail } from "@/lib/email/notifications";
import { getOrderById } from "@/prisma/order";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createInvoiceSentNotification } from "@/lib/notifications/in-app";
import { scheduleInvalidateInvoiceCaches } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import type { InvoiceEmailData, BillingAddress } from "@/types";

/**
 * POST /api/invoices/:id/send
 * Send invoice via email to client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: invoiceId } = await params;
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const isAdmin = session.role === "admin";

    // Admin can send any invoice; other roles only their own.
    let ownerUserId = userId;
    if (isAdmin) {
      const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (existing) ownerUserId = existing.userId;
    }

    // Get invoice
    const invoice = await getInvoiceById(invoiceId, ownerUserId);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get order to get order items for email
    const order = await prisma.order.findUnique({
      where: { id: invoice.orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found for invoice" },
        { status: 404 },
      );
    }

    // Get billing address from invoice or order
    const billingAddress =
      (invoice.billingAddress as unknown as BillingAddress) ||
      (order.billingAddress as unknown as BillingAddress);

    // Extract client email and name from billing address or order
    const clientEmail =
      (billingAddress as unknown as { email?: string })?.email ||
      (order.shippingAddress as unknown as { email?: string })?.email ||
      null;

    const clientName =
      (billingAddress as unknown as { name?: string })?.name ||
      (order.shippingAddress as unknown as { name?: string })?.name ||
      "Customer";

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client email not found. Cannot send invoice." },
        { status: 400 },
      );
    }

    // Generate Stripe payment link if not already set and there's an amount due
    let paymentLink = invoice.paymentLink;
    if (!paymentLink && invoice.amountDue > 0 && isStripeConfigured()) {
      try {
        const stripe = getStripe();
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: Math.round(invoice.amountDue * 100), // Stripe uses cents
                product_data: {
                  name: `Invoice ${invoice.invoiceNumber}`,
                  description: `Payment for order ${order.orderNumber}`,
                },
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${baseUrl}/invoices/${invoice.id}?payment=success`,
          cancel_url: `${baseUrl}/invoices/${invoice.id}?payment=cancelled`,
          metadata: {
            type: "invoice",
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            orderId: invoice.orderId,
            orderNumber: order.orderNumber,
          },
        });

        paymentLink = checkoutSession.url;

        // Update invoice with payment link
        if (paymentLink) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { paymentLink },
          });
        }

        logger.info("Stripe payment link generated for invoice", {
          invoiceId: invoice.id,
          sessionId: checkoutSession.id,
        });
      } catch (error) {
        logger.warn("Failed to generate Stripe payment link:", error);
        // Continue without payment link - not a critical error
      }
    }

    // Prepare invoice email data
    // Extract dates safely - toISOString().split("T")[0] always returns a string, but TypeScript needs explicit type
    const invoiceDateStr: string =
      invoice.issuedAt.toISOString().split("T")[0] || "";
    const dueDateStr: string =
      invoice.dueDate.toISOString().split("T")[0] || "";

    const invoiceEmailData: InvoiceEmailData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoiceDateStr,
      dueDate: dueDateStr,
      clientName,
      clientEmail,
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.subtotal,
      })),
      subtotal: invoice.subtotal,
      tax: invoice.tax || undefined,
      shipping: invoice.shipping ?? undefined,
      discount: invoice.discount || undefined,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      paymentLink: paymentLink || undefined,
      invoiceUrl: `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }/invoices/${invoice.id}`,
      status: invoice.status as InvoiceEmailData["status"],
    };

    // Send invoice email (async, don't block response)
    sendInvoiceEmail(invoiceEmailData, clientEmail, clientName).catch(
      (error) => {
        logger.error("Failed to send invoice email:", error);
      },
    );

    // Mark invoice as sent
    const updatedInvoice = await markInvoiceAsSent(invoiceId, ownerUserId);

    // Notify order owner in-app (non-blocking)
    if (order.userId) {
      createInvoiceSentNotification(
        order.userId,
        invoiceId,
        invoice.invoiceNumber,
      ).catch((err) => {
        logger.warn("Failed to create invoice-sent notification", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
    scheduleInvalidateInvoiceCaches();
    logger.info("Invoice email sent successfully", {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      clientEmail,
      userId,
    });

    // Transform invoice for response
    const transformedInvoice = {
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      orderId: updatedInvoice.orderId,
      userId: updatedInvoice.userId,
      clientId: updatedInvoice.clientId,
      status: updatedInvoice.status,
      subtotal: updatedInvoice.subtotal,
      tax: updatedInvoice.tax,
      shipping: updatedInvoice.shipping ?? null,
      discount: updatedInvoice.discount,
      total: updatedInvoice.total,
      amountPaid: updatedInvoice.amountPaid,
      amountDue: updatedInvoice.amountDue,
      dueDate: updatedInvoice.dueDate.toISOString(),
      issuedAt: updatedInvoice.issuedAt.toISOString(),
      sentAt: updatedInvoice.sentAt?.toISOString() || null,
      paidAt: updatedInvoice.paidAt?.toISOString() || null,
      cancelledAt: updatedInvoice.cancelledAt?.toISOString() || null,
      paymentLink: updatedInvoice.paymentLink,
      notes: updatedInvoice.notes,
      billingAddress: updatedInvoice.billingAddress,
      createdAt: updatedInvoice.createdAt.toISOString(),
      updatedAt: updatedInvoice.updatedAt?.toISOString() || null,
      createdBy: updatedInvoice.createdBy,
      updatedBy: updatedInvoice.updatedBy,
    };

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
      invoice: transformedInvoice,
    });
  } catch (error) {
    logger.error("Error sending invoice:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send invoice",
      },
      { status: 500 },
    );
  }
}
