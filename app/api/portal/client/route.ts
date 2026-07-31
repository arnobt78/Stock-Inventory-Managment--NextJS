/**
 * Client Portal API Route
 * GET /api/portal/client — get client dashboard data
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getClientDashboard } from "@/lib/server/client-dashboard";
import { getCache, setCache } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import type { ClientPortalDashboard } from "@/types";

/**
 * GET /api/portal/client
 * Returns client dashboard data for the authenticated client user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
      session.id,
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Only client role can fetch their own portal dashboard (avoid admin data leaking into client view)
    if (session.role !== "client") {
      return NextResponse.json(
        { error: "Access denied. Client role required." },
        { status: 403 },
      );
    }

    // Check cache — v2 bust: densify recentOrders product/category/supplier meta (REQ-0224)
    const cacheKey = `portal:client:v2:${session.id}`;
    const cacheReadStartedAt = Date.now();
    const cached = await getCache<ClientPortalDashboard>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get client dashboard
    const dashboard = await getClientDashboard(session.id, session.name);

    // Cache for 5 minutes
    await setCache(cacheKey, dashboard, 300, { fetchedAt: cacheReadStartedAt });

    return NextResponse.json(dashboard);
  } catch (error) {
    logger.error("Error fetching client dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch client dashboard" },
      { status: 500 },
    );
  }
}
