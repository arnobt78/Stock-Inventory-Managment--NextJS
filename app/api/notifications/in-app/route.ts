/**
 * In-App Notifications API Route Handler
 * Handles in-app notification CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getNotificationsByUser,
  getUnreadNotificationCount,
} from "@/prisma/notification";
import {
  getCache,
  setCache,
  invalidateCache,
  cacheKeys,
} from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import type { NotificationFilters } from "@/types";

/**
 * GET /api/notifications/in-app
 * Fetch all notifications for the authenticated user
 * Supports filtering by read status and type
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
    const { searchParams } = new URL(request.url);

    // Build filters from query parameters
    const filters: NotificationFilters = {
      read: searchParams.get("read")
        ? searchParams.get("read") === "true"
        : undefined,
      type: searchParams.getAll("type").length > 0
        ? (searchParams.getAll("type") as NotificationFilters["type"])
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit") || "50", 10)
        : 50,
    };

    // Check cache first
    const cacheKey = cacheKeys.notifications.list(
      userId,
      filters as Record<string, unknown>
    );
    const cacheReadStartedAt = Date.now();
    const cachedNotifications = await getCache(cacheKey);

    if (cachedNotifications) {
      logger.info("Cache hit for notifications", { userId, filters });
      return NextResponse.json(cachedNotifications);
    }

    // Fetch notifications from database
    const notifications = await getNotificationsByUser(userId, filters);

    // Transform notifications for response (convert Dates to ISO strings)
    const transformedNotifications = notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() || null,
      metadata: notification.metadata || null,
    }));

    // Cache the result for 1 minute (notifications change frequently)
    await setCache(cacheKey, transformedNotifications, 60, { fetchedAt: cacheReadStartedAt });

    logger.info("Fetched notifications from DB and cached", { userId, filters });

    return NextResponse.json(transformedNotifications);
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}

