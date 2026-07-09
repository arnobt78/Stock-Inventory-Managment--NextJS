/**
 * Admin Client Invoices API
 * GET /api/admin/client-invoices — invoices for orders that contain products owned by the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { getClientInvoicesForProductOwner } from "@/lib/server/invoices-data";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import type { InvoiceFilters } from "@/types";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
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

    const invoices = await getClientInvoicesForProductOwner(
      session.id,
      filters,
    );
    return NextResponse.json(invoices);
  } catch (error) {
    logger.error("Error fetching admin client invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch client invoices" },
      { status: 500 },
    );
  }
}
