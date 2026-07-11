/**
 * Mark All Notifications as Read API Route Handler
 * Handles marking all notifications as read for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { markAllNotificationsAsRead } from "@/prisma/notification";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";

import { scheduleInvalidateAllServerCaches } from "@/lib/cache";
/**
 * PUT /api/notifications/in-app/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Mark all notifications as read
    const count = await markAllNotificationsAsRead(userId);
    scheduleInvalidateAllServerCaches();
    logger.info("Marked all notifications as read", { userId, count });

    return NextResponse.json({
      success: true,
      count,
      message: `Marked ${count} notification(s) as read`,
    });
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark notifications as read",
      },
      { status: 500 }
    );
  }
}