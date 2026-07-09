/**
 * Server-side navbar notification prefetch (REQ-0025).
 * Mirrors GET /api/notifications/in-app list + unread count for ShellSsr hydration.
 */
import {
  getNotificationsByUser,
  getUnreadNotificationCount,
} from "@/prisma/notification";
import type { Notification } from "@/types";

/** Same shape as GET /api/notifications/in-app (ISO date strings). */
function transformNotification(
  notification: Awaited<ReturnType<typeof getNotificationsByUser>>[number],
): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type as Notification["type"],
    title: notification.title,
    message: notification.message,
    link: notification.link,
    read: notification.read,
    createdAt: notification.createdAt.toISOString() as unknown as Date,
    readAt: notification.readAt
      ? (notification.readAt.toISOString() as unknown as Date)
      : null,
    metadata: (notification.metadata as Notification["metadata"]) ?? null,
  };
}

export type ShellNotificationsData = {
  initialNotifications: Notification[];
  initialUnreadCount: number;
};

/** Navbar bell: top 20 notifications + unread badge count. */
export async function getShellNotificationsForUser(
  userId: string,
): Promise<ShellNotificationsData> {
  const [rows, initialUnreadCount] = await Promise.all([
    getNotificationsByUser(userId, { limit: 20 }),
    getUnreadNotificationCount(userId),
  ]);
  return {
    initialNotifications: rows.map(transformNotification),
    initialUnreadCount,
  };
}
