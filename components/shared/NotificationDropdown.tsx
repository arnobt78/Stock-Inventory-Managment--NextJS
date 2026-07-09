/**
 * Notification Dropdown Component
 * Displays list of notifications in a dropdown menu
 */

"use client";

import React from "react";
import Link from "next/link";
import { ClientRelativeTime } from "@/components/shared/ClientDateDisplay";
import {
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Bell,
  Loader2,
  Star,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useUpdateNotification,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/queries";
import type { Notification, NotificationType } from "@/types";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "low_stock":
    case "stock_out":
      return AlertCircle;
    case "order_confirmation":
    case "order_status_update":
    case "client_order_received":
      return ShoppingCart;
    case "product_review_submitted":
      return Star;
    case "shipping_notification":
      return Truck;
    case "invoice_ready":
    case "invoice_sent":
      return FileText;
    case "support_ticket_created":
    case "support_ticket_replied":
      return MessageSquare;
    case "import_complete":
    case "import_failed":
      return Package;
    default:
      return Bell;
  }
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "low_stock":
      return "text-orange-600 dark:text-orange-400";
    case "stock_out":
      return "text-red-600 dark:text-red-400";
    case "order_confirmation":
    case "order_status_update":
      return "text-blue-600 dark:text-blue-400";
    case "client_order_received":
      return "text-violet-600 dark:text-violet-400";
    case "product_review_submitted":
      return "text-amber-600 dark:text-amber-400";
    case "shipping_notification":
      return "text-purple-600 dark:text-purple-400";
    case "invoice_ready":
    case "invoice_sent":
      return "text-green-600 dark:text-green-400";
    case "support_ticket_created":
      return "text-sky-600 dark:text-sky-400";
    case "support_ticket_replied":
      return "text-blue-600 dark:text-blue-400";
    case "import_complete":
      return "text-green-600 dark:text-green-400";
    case "import_failed":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

/**
 * Notification Dropdown Component
 */
export function NotificationDropdown({
  notifications,
  isLoading,
  isError,
  onClose,
}: NotificationDropdownProps) {
  const updateNotification = useUpdateNotification();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadNotifications = notifications.filter((n) => !n.read);
  const hasUnread = unreadNotifications.length > 0;

  const handleMarkAsRead = async (notificationId: string) => {
    await updateNotification.mutateAsync({
      id: notificationId,
      read: true,
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification.mutateAsync(notificationId);
  };

  return (
    <div className="w-full overflow-hidden rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-rose-400/20 dark:border-white/10">
        <h3 className="text-lg font-medium text-gray-700 dark:text-white">
          Notifications
        </h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3 mr-1" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-red-500 dark:text-red-400">
            <p className="text-sm">Failed to load notifications</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 sm:p-6 text-center text-gray-500 dark:text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-rose-400/10 dark:divide-white/10">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-rose-50/50 dark:hover:bg-white/5 transition-colors",
                    !notification.read && "bg-rose-50/30 dark:bg-rose-500/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        iconColor,
                        !notification.read
                          ? "bg-rose-100 dark:bg-rose-500/20"
                          : "bg-gray-100 dark:bg-gray-700",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={onClose}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <p
                            className={cn(
                              "text-sm font-medium text-gray-700 dark:text-white mb-1",
                              !notification.read && "font-medium",
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <p
                            className={cn(
                              "text-sm font-medium text-gray-700 dark:text-white mb-1",
                              !notification.read && "font-medium",
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                        </>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        <ClientRelativeTime
                          date={notification.createdAt}
                          className="text-xs text-gray-500 dark:text-gray-400"
                        />
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={updateNotification.isPending}
                          className="h-6 w-6 p-0"
                          aria-label="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteNotification.isPending}
                        className="h-6 w-6 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-0"
                      >
                        New
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t border-rose-400/20 dark:border-white/10 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
