/**
 * Notification Bell Component
 * Displays a bell icon with unread notification count badge
 * Opens notification dropdown when clicked
 */

"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnreadNotificationCount, useNotifications } from "@/hooks/queries";
import { NotificationDropdown } from "./NotificationDropdown";
import { useShellSsr } from "@/contexts/shell-ssr-context";

/**
 * Notification Bell Component
 * Shows bell icon with unread count badge and opens dropdown on click.
 * Uses Radix DropdownMenu portal (same as navbar profile/theme) so the panel
 * is not clipped by header overflow-x-hidden / sticky layout.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { initialNotifications, initialUnreadCount } = useShellSsr();

  // Fetch unread notification count for badge
  const {
    data: unreadCount = 0,
    isLoading: isLoadingCount,
    isError: isErrorCount,
  } = useUnreadNotificationCount(initialUnreadCount);

  // Fetch notifications for dropdown
  // Always fetch to keep data fresh, but only show when dropdown is open
  const {
    data: notifications = initialNotifications ?? [],
    isLoading: isLoadingNotifications,
    isError: isErrorNotifications,
  } = useNotifications({ limit: 20 }, initialNotifications, {
    enabled: isOpen,
  });

  // Always render the bell button, even if there's an error loading the count
  // This ensures the UI stays consistent and doesn't flicker

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 dark:from-rose-500/25 dark:via-rose-500/15 dark:to-rose-500/10 text-white shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-md transition duration-200 hover:border-rose-300/40 hover:from-rose-500/35 hover:via-rose-500/25 hover:to-rose-500/15 dark:hover:border-rose-300/40 dark:hover:from-rose-500/35 dark:hover:via-rose-500/25 dark:hover:to-rose-500/15 focus-visible:outline-none focus:outline-none focus-visible:ring-0 focus:ring-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-rose-400 dark:text-rose-300" />
          {!isLoadingCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium rounded-full border-2 border-white dark:border-gray-900"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 border-rose-400/30 dark:border-white/10 bg-white/95 dark:bg-popover/95 backdrop-blur-md shadow-[0_30px_80px_rgba(225,29,72,0.35)] dark:shadow-[0_30px_80px_rgba(225,29,72,0.25)] overflow-hidden"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoadingNotifications}
          isError={isErrorNotifications}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
