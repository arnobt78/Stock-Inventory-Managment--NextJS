/**
 * Import History Detail API Route Handler
 * GET /api/import-history/:id — fetch single import history record
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getHistoryDetailForPage } from "@/lib/server/history-detail-data";

/**
 * GET /api/import-history/:id
 * Fetch a single import history record by ID (scoped to user).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    const { id } = await params;
    const detail = await getHistoryDetailForPage(
      { id: session.id, role: session.role },
      id,
    );
    if (!detail) {
      return NextResponse.json(
        { error: "Import history record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    logger.error("Error fetching import history detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch import history record" },
      { status: 500 },
    );
  }
}
