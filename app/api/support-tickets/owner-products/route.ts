/**
 * GET /api/support-tickets/owner-products?ownerId=
 * REQ-0200 — Products owned by selected Send-to (for Related product picker).
 * Any authenticated role; not viewer-scoped like GET /api/products.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getOwnerProductsForSupport } from "@/lib/server/support-tickets-data";

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

    const ownerId = new URL(request.url).searchParams.get("ownerId")?.trim();
    if (!ownerId) {
      return NextResponse.json(
        { error: "ownerId is required" },
        { status: 400 },
      );
    }

    const products = await getOwnerProductsForSupport(ownerId);
    return NextResponse.json(products);
  } catch (error) {
    logger.error("Error fetching support ticket owner products:", error);
    return NextResponse.json(
      { error: "Failed to fetch owner products" },
      { status: 500 },
    );
  }
}
