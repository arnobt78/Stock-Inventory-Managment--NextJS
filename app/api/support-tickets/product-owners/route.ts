/**
 * GET /api/support-tickets/product-owners
 * Returns users who have at least one product (for "Send to" dropdown when creating a ticket).
 * REQ-0185 — include image + productCount for densify Select.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getProductOwnersForSupport } from "@/lib/server/support-tickets-data";

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

    const owners = await getProductOwnersForSupport();
    return NextResponse.json(owners);
  } catch (error) {
    logger.error("Error fetching product owners:", error);
    return NextResponse.json(
      { error: "Failed to fetch product owners" },
      { status: 500 },
    );
  }
}
