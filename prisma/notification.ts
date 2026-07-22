/**
 * Notification Prisma Utilities
 * Helper functions for notification database operations
 */

import { prisma } from "@/prisma/client";
import type {
  CreateNotificationInput,
  UpdateNotificationInput,
  NotificationFilters,
} from "@/types/notification";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { ApiError } from "@/lib/api/errors";

/**
 * Create a new notification
 *
 * @param data - Notification creation data
 * @returns Promise<Notification> - Created notification
 */
export async function createNotification(
  data: CreateNotificationInput
): Promise<Prisma.NotificationGetPayload<Record<string, never>>> {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || null,
      metadata: data.metadata
        ? (JSON.parse(JSON.stringify(data.metadata)) as Prisma.InputJsonValue)
        : null,
      read: false,
      createdAt: new Date(),
      readAt: null,
    },
  });
}

/**
 * Get all notifications for a user
 *
 * @param userId - User ID
 * @param filters - Optional filters for notifications
 * @returns Promise<Notification[]> - Array of notifications
 */
export async function getNotificationsByUser(
  userId: string,
  filters?: NotificationFilters
): Promise<Prisma.NotificationGetPayload<Record<string, never>>[]> {
  const where: Prisma.NotificationWhereInput = {
    userId,
  };

  // Filter by read status
  if (filters?.read !== undefined) {
    where.read = filters.read;
  }

  // Filter by type
  if (filters?.type && filters.type.length > 0) {
    where.type = { in: filters.type };
  }

  // Get notifications ordered by creation date (newest first)
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 50, // Default limit of 50, or use provided limit
  });

  return notifications;
}

/**
 * Get unread notification count for a user
 *
 * @param userId - User ID
 * @returns Promise<number> - Count of unread notifications
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Get a single notification by ID
 *
 * @param notificationId - Notification ID
 * @param userId - User ID (for authorization)
 * @returns Promise<Notification | null> - The notification or null if not found/unauthorized
 */
export async function getNotificationById(
  notificationId: string,
  userId: string
): Promise<Prisma.NotificationGetPayload<Record<string, never>> | null> {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId, // Ensure notification belongs to user
    },
  });
}

/**
 * Update notification (mark as read/unread)
 *
 * @param notificationId - Notification ID
 * @param data - Update data
 * @param userId - User ID (for authorization)
 * @returns Promise<Notification> - Updated notification
 * @throws Error if notification not found or unauthorized
 */
export async function updateNotification(
  notificationId: string,
  data: UpdateNotificationInput,
  userId: string
): Promise<Prisma.NotificationGetPayload<Record<string, never>>> {
  // Verify notification exists and belongs to user
  const existingNotification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!existingNotification) {
    // Expected 404 — missing id or not owned by user (not a 500)
    throw new ApiError("Notification not found or unauthorized", 404);
  }

  // Prepare update data
  const updateData: Prisma.NotificationUpdateInput = {};

  if (data.read !== undefined) {
    updateData.read = data.read;
    // Set readAt timestamp if marking as read, clear if marking as unread
    if (data.read) {
      updateData.readAt = new Date();
    } else {
      updateData.readAt = null;
    }
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: updateData,
  });
}

/**
 * Mark all notifications as read for a user
 *
 * @param userId - User ID
 * @returns Promise<number> - Count of updated notifications
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false, // Only update unread notifications
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  logger.info("Marked all notifications as read", {
    userId,
    count: result.count,
  });

  return result.count;
}

/**
 * Delete a notification
 *
 * @param notificationId - Notification ID
 * @param userId - User ID (for authorization)
 * @returns Promise<void>
 * @throws Error if notification not found or unauthorized
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  // Verify notification exists and belongs to user
  const existingNotification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!existingNotification) {
    // Expected 404 — already deleted / wrong user (never 500 → Sentry)
    throw new ApiError("Notification not found or unauthorized", 404);
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Delete old read notifications (cleanup utility)
 * Deletes read notifications older than specified days
 *
 * @param userId - User ID
 * @param daysOld - Number of days old to delete (default: 30)
 * @returns Promise<number> - Count of deleted notifications
 */
export async function deleteOldReadNotifications(
  userId: string,
  daysOld: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      read: true,
      readAt: {
        lte: cutoffDate,
      },
    },
  });

  logger.info("Deleted old read notifications", {
    userId,
    daysOld,
    count: result.count,
  });

  return result.count;
}
