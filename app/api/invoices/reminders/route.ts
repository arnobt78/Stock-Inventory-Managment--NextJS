/**
 * Payment Reminders API Route
 * POST /api/invoices/reminders — send payment reminders for overdue invoices
 *
 * This endpoint is designed to be called by a scheduled job (cron, QStash, etc.)
 * Can also be triggered manually by admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { sendInvoiceEmail } from "@/lib/email/notifications";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { scheduleInvalidateInvoiceCaches } from "@/lib/cache";
import type { InvoiceEmailData, BillingAddress } from "@/types";

/**
 * POST /api/invoices/reminders
 * Send payment reminders for overdue and soon-due invoices
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Check for optional authorization (admin or internal cron call)
    const session = await getSessionFromRequest(request);
    const authHeader = request.headers.get("authorization");
    const isInternalCall =
      authHeader === `Bearer ${process.env.INTERNAL_API_KEY}`;

    // Either admin or internal call required
    if (!isInternalCall && (!session || session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional days parameter (default: send for invoices due in 3 days or overdue)
    const body = await request.json().catch(() => ({}));
    const dueSoonDays = body.dueSoonDays ?? 3;

    const now = new Date();
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + dueSoonDays);

    // Find invoices that need reminders:
    // 1. Overdue invoices (not paid, not cancelled, past due date)
    // 2. Due soon invoices (due date within X days)
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ["sent", "overdue"],
        },
        amountDue: { gt: 0 },
        dueDate: {
          lte: dueSoonDate,
        },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (invoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No invoices require reminders",
        sent: 0,
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const invoice of invoices) {
      try {
        // Update status to overdue if past due date
        const isOverdue = invoice.dueDate < now;
        if (isOverdue && invoice.status !== "overdue") {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: "overdue", updatedAt: new Date() },
          });
        }

        // Get billing address
        const billingAddress = invoice.billingAddress as BillingAddress | null;

        // Get client email
        let clientEmail: string | null = null;
        let clientName = "Customer";

        if (invoice.clientId) {
          const client = await prisma.user.findUnique({
            where: { id: invoice.clientId },
            select: { email: true, username: true },
          });
          if (client) {
            clientEmail = client.email;
            clientName = client.username || "Customer";
          }
        }

        // Fallback to billing address email
        if (!clientEmail && billingAddress) {
          const billingWithEmail = billingAddress as BillingAddress & {
            email?: string;
            name?: string;
          };
          clientEmail = billingWithEmail.email || null;
          clientName = billingWithEmail.name || clientName;
        }

        if (!clientEmail) {
          errors.push(`No email found for invoice ${invoice.invoiceNumber}`);
          continue;
        }

        // Prepare email data
        const invoiceDateStr =
          invoice.issuedAt.toISOString().split("T")[0] || "";
        const dueDateStr = invoice.dueDate.toISOString().split("T")[0] || "";

        const emailData: InvoiceEmailData = {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoiceDateStr,
          dueDate: dueDateStr,
          clientName,
          clientEmail,
          orderNumber: invoice.order?.orderNumber || "N/A",
          items:
            invoice.order?.items.map((item) => ({
              description: item.productName,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: item.subtotal,
            })) || [],
          subtotal: invoice.subtotal,
          tax: invoice.tax || undefined,
          shipping: invoice.shipping ?? undefined,
          discount: invoice.discount || undefined,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          amountDue: invoice.amountDue,
          paymentLink: invoice.paymentLink || undefined,
          invoiceUrl: `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
          }/invoices/${invoice.id}`,
          status: isOverdue
            ? "overdue"
            : ("sent" as InvoiceEmailData["status"]),
        };

        // Send reminder email
        await sendInvoiceEmail(emailData, clientEmail, clientName);
        sentCount++;

        logger.info(
          `Payment reminder sent for invoice ${invoice.invoiceNumber}`,
          {
            invoiceId: invoice.id,
            isOverdue,
            clientEmail,
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed for ${invoice.invoiceNumber}: ${errorMessage}`);
        logger.error(
          `Failed to send reminder for invoice ${invoice.id}:`,
          error,
        );
      }
    }

    if (sentCount > 0) {
    await scheduleInvalidateInvoiceCaches();
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} payment reminders`,
      sent: sentCount,
      total: invoices.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error("Error sending payment reminders:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send payment reminders",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/invoices/reminders
 * Get count of invoices that need reminders (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + 3);

    const [overdueCount, dueSoonCount] = await Promise.all([
      prisma.invoice.count({
        where: {
          status: { in: ["sent", "overdue"] },
          amountDue: { gt: 0 },
          dueDate: { lt: now },
        },
      }),
      prisma.invoice.count({
        where: {
          status: "sent",
          amountDue: { gt: 0 },
          dueDate: {
            gte: now,
            lte: dueSoonDate,
          },
        },
      }),
    ]);

    return NextResponse.json({
      overdue: overdueCount,
      dueSoon: dueSoonCount,
      total: overdueCount + dueSoonCount,
    });
  } catch (error) {
    logger.error("Error fetching reminder counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder counts" },
      { status: 500 },
    );
  }
}
