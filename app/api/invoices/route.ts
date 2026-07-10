/**
 * Invoices API Route Handler
 * Handles invoice CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { createInvoice, getInvoicesByUser, getInvoicesByClientId, getInvoicesByOrderIds } from "@/prisma/invoice";
import { createInvoiceSchema } from "@/lib/validations";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { createAuditLog } from "@/prisma/audit-log";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { prisma } from "@/prisma/client";
import { fetchOrderUserIdMap } from "@/lib/invoices/enrich-order-user-ids";
import { getStoreOrderIds } from "@/lib/invoices/store-order-ids";
import type { CreateInvoiceInput, InvoiceFilters } from "@/types";

/**
 * GET /api/invoices
 * Fetch all invoices for the authenticated user
 * Supports filtering by status, order ID, date range, etc.
 */
export async function GET(request: NextRequest) {
  try {
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
    const isClient = session.role === "client";
    const { searchParams } = new URL(request.url);

    // Build filters from query parameters
    const filters: InvoiceFilters = {
      searchTerm: searchParams.get("searchTerm") || undefined,
      status:
        searchParams.getAll("status").length > 0
          ? (searchParams.getAll("status") as InvoiceFilters["status"])
          : undefined,
      orderId: searchParams.get("orderId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      dueDateStart: searchParams.get("dueDateStart") || undefined,
      dueDateEnd: searchParams.get("dueDateEnd") || undefined,
    };

    const listScope =
      !isClient && searchParams.get("scope") === "store" ? "store" : "issuer";

    // Check cache first (scoped per user / role)
    const cacheKey = cacheKeys.invoices.list({
      ...(filters as Record<string, unknown>),
      ...(isClient
        ? { byClient: true, userId }
        : { userId, scope: listScope }),
    });
    const cachedInvoices = await getCache(cacheKey);

    if (cachedInvoices) {
      return NextResponse.json(cachedInvoices);
    }

    // Fetch invoices: client sees their own; admin/user see issuer or store-wide list
    const invoices = isClient
      ? await getInvoicesByClientId(userId, filters)
      : listScope === "store"
        ? await getInvoicesByOrderIds(await getStoreOrderIds(userId), filters)
        : await getInvoicesByUser(userId, filters);

    // For client role, resolve the actual issuer (product owner) from order items
    let issuerMap = new Map<string, { name: string | null; email: string }>();
    if (isClient && invoices.length > 0) {
      const orderIds = [...new Set(invoices.map((inv) => inv.orderId))];
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { items: { include: { product: { select: { userId: true } } } } },
      });
      const invoiceIssuerIdMap = new Map<string, string>();
      for (const order of orders) {
        const ownerIds = [
          ...new Set(
            order.items
              .map((item) => (item as { product?: { userId?: string } }).product?.userId)
              .filter(Boolean),
          ),
        ] as string[];
        if (ownerIds.length > 0 && ownerIds[0]) {
          for (const inv of invoices) {
            if (inv.orderId === order.id) invoiceIssuerIdMap.set(inv.id, ownerIds[0]);
          }
        }
      }
      // Fall back to createdBy / userId for invoices without resolved product owner
      for (const inv of invoices) {
        if (!invoiceIssuerIdMap.has(inv.id)) {
          invoiceIssuerIdMap.set(inv.id, inv.createdBy ?? inv.userId);
        }
      }
      const allIssuerIds = [...new Set(Array.from(invoiceIssuerIdMap.values()))];
      const users = await prisma.user.findMany({
        where: { id: { in: allIssuerIds } },
        select: { id: true, name: true, email: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      for (const [invId, issuerId] of invoiceIssuerIdMap) {
        const u = userMap.get(issuerId);
        if (u) issuerMap.set(invId, { name: u.name, email: u.email });
      }
    }

    // For admin/user role, resolve the client name/email for each invoice
    let clientMap = new Map<string, { name: string | null; email: string }>();
    let orderUserIdMap = new Map<string, string>();
    if (!isClient && invoices.length > 0) {
      const clientIds = [...new Set(invoices.map((inv) => inv.clientId).filter(Boolean))] as string[];
      if (clientIds.length > 0) {
        const clients = await prisma.user.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true, email: true },
        });
        clientMap = new Map(clients.map((c) => [c.id, { name: c.name, email: c.email }]));
      }
      orderUserIdMap = await fetchOrderUserIdMap(
        invoices.map((inv) => inv.orderId),
      );
    }

    // Transform invoices for response (convert Dates to ISO strings)
    const transformedInvoices = invoices.map((invoice) => {
      const issuer = isClient ? issuerMap.get(invoice.id) : undefined;
      const clientInfo = !isClient && invoice.clientId ? clientMap.get(invoice.clientId) : undefined;
      return {
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
        ...(issuer ? { issuedByName: issuer.name ?? issuer.email, issuedByEmail: issuer.email } : {}),
        ...(clientInfo ? { clientName: clientInfo.name ?? clientInfo.email, clientEmail: clientInfo.email } : {}),
        ...(!isClient
          ? { orderUserId: orderUserIdMap.get(invoice.orderId) ?? null }
          : {}),
      };
    });

    // Cache the result for 5 minutes
    await setCache(cacheKey, transformedInvoices, 300);

    return NextResponse.json(transformedInvoices);
  } catch (error) {
    logger.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch invoices",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice from an order
 */
export async function POST(request: NextRequest) {
  try {
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
    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid invoice creation data", {
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

    const newInvoiceData: CreateInvoiceInput = validationResult.data;

    // Create invoice in database
    const invoice = await createInvoice(newInvoiceData, userId);

    createAuditLog({
      userId,
      action: "create",
      entityType: "invoice",
      entityId: invoice.id,
      details: { invoiceNumber: invoice.invoiceNumber },
    }).catch(() => {});

    const { invalidateAllServerCaches } = await import("@/lib/cache");
    await invalidateAllServerCaches().catch(() => {});

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

    logger.info("Invoice created successfully", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      userId,
    });

    return NextResponse.json(transformedInvoice, { status: 201 });
  } catch (error) {
    // Duplicate invoice is an expected business-logic rejection — return 409 and do not log to Sentry
    if (error instanceof Error && error.message.startsWith("Invoice already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error("Error creating invoice:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create invoice",
      },
      { status: 500 },
    );
  }
}
