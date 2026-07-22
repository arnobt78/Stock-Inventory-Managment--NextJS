/**
 * Invoice PDF API Route
 * GET /api/invoices/[id]/pdf — generate and download invoice PDF
 *
 * REQ-0204 — authorize via getInvoiceDetailForPage (admin / client / supplier /
 * issuer / product-owner), then load PDF payload by invoice id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { generateInvoicePDF } from "@/lib/pdf";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getInvoiceDetailForPage } from "@/lib/server/invoice-detail-data";

/**
 * GET /api/invoices/[id]/pdf
 * Generate and return invoice PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // REQ-0204 — same role gate as invoice detail SSR (client + supplier + owner)
    const authorized = await getInvoiceDetailForPage(
      { id: session.id, role: session.role },
      id,
    );
    if (!authorized) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get client info if available
    let clientName = "Customer";
    if (invoice.clientId) {
      const client = await prisma.user.findUnique({
        where: { id: invoice.clientId },
        select: { username: true, email: true },
      });
      clientName = client?.username || client?.email || "Customer";
    }

    // Prepare PDF data
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      shipping: invoice.shipping,
      discount: invoice.discount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      clientName,
      billingAddress: invoice.billingAddress as {
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      } | null,
      items:
        invoice.order?.items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })) || [],
      notes: invoice.notes,
    };

    // Generate PDF
    const pdfDataUri = generateInvoicePDF(pdfData);

    // Extract base64 data
    const base64Data = pdfDataUri.split(",")[1] || "";
    const pdfBuffer = Buffer.from(base64Data, "base64");

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate invoice PDF",
      },
      { status: 500 },
    );
  }
}
