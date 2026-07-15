/**
 * Import History API Route Handler
 * GET /api/import-history — list import history for authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getImportHistoryByUser } from "@/prisma/import-history";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import type { ImportHistoryForPage, ImportHistoryErrorItem } from "@/types";

function transformRecord(
  r: Awaited<ReturnType<typeof getImportHistoryByUser>>[number],
): ImportHistoryForPage {
  const raw = r.errors as unknown;
  const errors: ImportHistoryErrorItem[] | null = Array.isArray(raw)
    ? raw
    : null;
  return {
    id: r.id,
    userId: r.userId,
    importType: r.importType as ImportHistoryForPage["importType"],
    fileName: r.fileName,
    fileSize: r.fileSize,
    totalRows: r.totalRows,
    successRows: r.successRows,
    failedRows: r.failedRows,
    errors,
    status: r.status as ImportHistoryForPage["status"],
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

/**
 * GET /api/import-history
 * Fetch import history for the authenticated user.
 * Optional query: importType, limit.
 */
export async function GET(request: NextRequest) {
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

    const userId = session.id;
    const { searchParams } = new URL(request.url);
    const importType = searchParams.get("importType") as
      | "products"
      | "orders"
      | "suppliers"
      | "categories"
      | null;
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100)
      : 50;
    const useCache = !importType && limit === 50;
    const cacheReadStartedAt = Date.now();

    if (useCache) {
      const cacheKey = cacheKeys.history.list({ userId });
      const cached = await getCache<ImportHistoryForPage[]>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const records = await getImportHistoryByUser(
      userId,
      importType ?? undefined,
      limit,
    );
    const transformed = records.map(transformRecord);

    if (useCache) {
      const cacheKey = cacheKeys.history.list({ userId });
      await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
    }

    return NextResponse.json(transformed);
  } catch (error) {
    logger.error("Error fetching import history:", error);
    return NextResponse.json(
      { error: "Failed to fetch import history" },
      { status: 500 },
    );
  }
}
