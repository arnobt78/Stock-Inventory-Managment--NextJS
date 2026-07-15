/**
 * Unread Notification Count API Route
 * Returns the count of unread notifications for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getUnreadNotificationCount } from "@/prisma/notification";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";

/**
 * GET /api/notifications/in-app/unread-count
 * Get unread notification count for the authenticated user
 * Uses caching for performance (1 minute cache)
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
      session.id
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const userId = session.id;

    // Check cache first (1 minute cache for unread count)
    const cacheKey = cacheKeys.notifications.unreadCount(userId);
    const cacheReadStartedAt = Date.now();
    const cachedCount = await getCache<number>(cacheKey);

    if (cachedCount !== null) {
      logger.debug("Cache hit for unread notification count", { userId });
      return NextResponse.json({ count: cachedCount });
    }

    // Fetch unread count from database
    const count = await getUnreadNotificationCount(userId);

    // Cache the result for 1 minute
    await setCache(cacheKey, count, 60, { fetchedAt: cacheReadStartedAt });

    logger.debug("Fetched unread notification count from DB", { userId, count });

    return NextResponse.json({ count });
  } catch (error) {
    logger.error("Error fetching unread notification count:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch unread notification count",
      },
      { status: 500 }
    );
  }
}
