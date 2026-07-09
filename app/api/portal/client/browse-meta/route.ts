/**
 * Client Browse Meta API
 * GET /api/portal/client/browse-meta — product owners (admins) + global stats for client browse
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getClientBrowseMetaForPage } from "@/lib/server/client-browse-data";

/**
 * GET /api/portal/client/browse-meta
 * Returns product owners (admins) and global stats for client browse page
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
    if (session.role !== "client") {
      return NextResponse.json(
        { error: "Access denied. Client role required." },
        { status: 403 },
      );
    }

    const meta = await getClientBrowseMetaForPage();
    return NextResponse.json(meta);
  } catch (error) {
    logger.error("Error fetching client browse meta:", error);
    return NextResponse.json(
      { error: "Failed to fetch browse meta" },
      { status: 500 },
    );
  }
}
