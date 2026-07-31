/**
 * Supplier Portal API Route
 * GET /api/portal/supplier — get supplier dashboard data
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getSupplierDashboard } from "@/lib/server/supplier-dashboard";
import { getCache, setCache } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import type { SupplierPortalDashboard } from "@/types";

/**
 * GET /api/portal/supplier
 * Returns supplier dashboard data for the authenticated supplier user
 */
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

    // Only supplier role can fetch their portal dashboard (avoid admin data leaking into supplier view)
    if (session.role !== "supplier") {
      return NextResponse.json(
        { error: "Access denied. Supplier role required." },
        { status: 403 },
      );
    }

    // Check cache — v3 bust: densify recentOrders product/category/buyer meta (REQ-0224)
    const cacheKey = `portal:supplier:v3:${session.id}`;
    const cacheReadStartedAt = Date.now();
    const cached = await getCache<SupplierPortalDashboard>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get supplier dashboard
    const dashboard = await getSupplierDashboard(session.id);

    if (!dashboard) {
      return NextResponse.json(
        { error: "No supplier entity linked to this account" },
        { status: 404 },
      );
    }

    // Cache for 5 minutes
    await setCache(cacheKey, dashboard, 300, { fetchedAt: cacheReadStartedAt });

    return NextResponse.json(dashboard);
  } catch (error) {
    logger.error("Error fetching supplier dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier dashboard" },
      { status: 500 },
    );
  }
}
