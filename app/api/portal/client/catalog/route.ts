/**
 * Client Portal Catalog API Route
 * GET /api/portal/client/catalog — read-only catalog (suppliers, categories, products) for client role
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getCache, setCache } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getClientCatalogOverview } from "@/lib/server/client-catalog-data";
import type { ClientCatalogOverview } from "@/types";

const CACHE_TTL = 300; // 5 minutes

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

    if (session.role !== "client") {
      return NextResponse.json(
        { error: "Access denied. Client role required." },
        { status: 403 },
      );
    }

    // REQ-0224 — v3 bust: products include imageUrl + supplierImage
    const cacheKey = `portal:client:catalog:v3:${session.id}`;
    const cacheReadStartedAt = Date.now();
    const cached = await getCache<ClientCatalogOverview>(cacheKey);
    // REQ-0077 — skip legacy v1 payloads missing meta totals
    if (cached?.meta) {
      return NextResponse.json(cached);
    }

    const overview = await getClientCatalogOverview(session.id);
    await setCache(cacheKey, overview, CACHE_TTL, { fetchedAt: cacheReadStartedAt });
    return NextResponse.json(overview);
  } catch (error) {
    logger.error("Error fetching client catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 },
    );
  }
}
