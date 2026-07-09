/**
 * Supplier Detail API Route Handler
 * App Router route handler for individual supplier operations (GET)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getSupplierDetailForPage } from "@/lib/server/supplier-detail-data";

/**
 * GET /api/suppliers/:id
 * Get supplier details by ID with all related data.
 * Admin can view own suppliers or the global Demo Supplier (test@supplier.com).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transformedSupplier = await getSupplierDetailForPage(
      { id: session.id, role: session.role },
      id,
    );

    if (!transformedSupplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json(transformedSupplier);
  } catch (error) {
    logger.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}