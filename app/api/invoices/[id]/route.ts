/**
 * Individual Invoice API Route Handler
 * Handles operations on individual invoices (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getInvoiceById,
  getInvoiceByIdForProductOwner,
  updateInvoice,
  deleteInvoice,
  markInvoiceAsSent,
} from "@/prisma/invoice";
import { prisma } from "@/prisma/client";
import { updateInvoiceSchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createAuditLog } from "@/prisma/audit-log";
import type { UpdateInvoiceInput } from "@/types";
import { getInvoiceDetailForPage } from "@/lib/server/invoice-detail-data";

import { scheduleInvalidateAllServerCaches } from "@/lib/cache";
/**
 * GET /api/invoices/:id
 * Fetch a single invoice by ID
 */
export async function GET(
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

    const transformedInvoice = await getInvoiceDetailForPage(
      { id: session.id, role: session.role },
      invoiceId,
    );

    if (!transformedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(transformedInvoice);
  } catch (error) {
    logger.error("Error fetching invoice:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch invoice",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/invoices/:id
 * Update an existing invoice
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
    const body = await request.json();

    // Validate request body
    const validationResult = updateInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid invoice update data", {
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

    const updateData: UpdateInvoiceInput = {
      ...validationResult.data,
      id,
    };

    // Admin can update any invoice; product owners can update invoices linked to
    // their products (including legacy invoices where userId = client).
    const isAdmin = session.role === "admin";
    let ownerUserId = userId;
    if (isAdmin) {
      const existing = await prisma.invoice.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      ownerUserId = existing.userId;
    } else {
      const existingCheck = await prisma.invoice.findFirst({
        where: { id, userId },
      });
      if (!existingCheck) {
        const poInvoice = await getInvoiceByIdForProductOwner(id, userId);
        if (poInvoice) {
          ownerUserId = poInvoice.userId;
        }
      }
    }

    // Update invoice
    const invoice = await updateInvoice(id, updateData, ownerUserId);

    // When invoice is marked as paid, also confirm the associated order + deduct stock
    if (invoice.status === "paid" && invoice.orderId) {
      const linkedOrder = await prisma.order.findUnique({
        where: { id: invoice.orderId },
        include: { items: true },
      });
      if (linkedOrder && linkedOrder.paymentStatus !== "paid") {
        await prisma.order.update({
          where: { id: invoice.orderId },
          data: {
            paymentStatus: "paid",
            status: linkedOrder.status === "pending" ? "confirmed" : linkedOrder.status,
            updatedAt: new Date(),
          },
        });
        if (linkedOrder.status === "pending") {
          for (const item of linkedOrder.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                quantity: { decrement: item.quantity },
                reservedQuantity: { decrement: item.quantity },
              },
            });
          }
        }
      } else if (linkedOrder && linkedOrder.paymentStatus === "paid" && linkedOrder.status === "pending") {
        await prisma.order.update({
          where: { id: invoice.orderId },
          data: { status: "confirmed", updatedAt: new Date() },
        });
      }
    }

    createAuditLog({
      userId,
      action: "update",
      entityType: "invoice",
      entityId: id,
      details: { invoiceNumber: invoice.invoiceNumber },
    }).catch(() => {});
    scheduleInvalidateAllServerCaches();
    // Transform invoice for response
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      userId: invoice.userId,
      clientId: invoice.clientId,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      shipping: invoice.shipping ?? null,
      discount: invoice.discount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate.toISOString(),
      issuedAt: invoice.issuedAt.toISOString(),
      sentAt: invoice.sentAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      cancelledAt: invoice.cancelledAt?.toISOString() || null,
      paymentLink: invoice.paymentLink,
      notes: invoice.notes,
      billingAddress: invoice.billingAddress,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString() || null,
      createdBy: invoice.createdBy,
      updatedBy: invoice.updatedBy,
    };

    logger.info("Invoice updated successfully", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      userId,
    });

    return NextResponse.json(transformedInvoice);
  } catch (error) {
    logger.error("Error updating invoice:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update invoice",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/invoices/:id
 * Delete an invoice
 */
export async function DELETE(
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

    // Admin can delete any invoice; product owners can delete invoices linked to their products.
    let ownerUserId = userId;
    if (isAdmin) {
      const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (existing) ownerUserId = existing.userId;
    } else {
      const existingCheck = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId },
      });
      if (!existingCheck) {
        const poInvoice = await getInvoiceByIdForProductOwner(invoiceId, userId);
        if (poInvoice) ownerUserId = poInvoice.userId;
      }
    }

    const existingInvoice = await getInvoiceById(invoiceId, ownerUserId);
    await deleteInvoice(invoiceId, ownerUserId);

    createAuditLog({
      userId,
      action: "delete",
      entityType: "invoice",
      entityId: invoiceId,
      details: existingInvoice ? { invoiceNumber: existingInvoice.invoiceNumber } : undefined,
    }).catch(() => {});
    scheduleInvalidateAllServerCaches();
    logger.info("Invoice deleted successfully", { invoiceId, userId });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting invoice:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete invoice",
      },
      { status: 500 },
    );
  }
}
