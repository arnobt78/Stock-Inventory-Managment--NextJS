/**
 * Notification Query Hooks
 * TanStack Query hooks for fetching and managing in-app notifications
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage, isExpectedClientError } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Notification,
  NotificationFilters,
  UpdateNotificationInput,
} from "@/types";

/**
 * Fetch all notifications for the authenticated user
 * @param filters - Optional filters for notifications
 */
export function useNotifications(
  filters?: NotificationFilters,
  initialData?: Notification[],
  options?: { enabled?: boolean },
) {
  const hasSeed = initialData !== undefined;
  const enabled = options?.enabled ?? true;
  return useQuery<Notification[], Error>({
    queryKey: queryKeys.notifications.list(
      filters as Record<string, unknown> | undefined
    ),
    queryFn: async () => {
      const response = await apiClient.notifications.getAll(filters);
      return response.data;
    },
    enabled,
    staleTime: hasSeed ? 1000 * 60 : 1000 * 30,
    refetchInterval: hasSeed ? false : 1000 * 60,
    refetchIntervalInBackground: false,
    ...withInitialData(initialData),
  });
}

/**
 * Fetch unread notification count
 * Used for badge display
 */
export function useUnreadNotificationCount(initialData?: number) {
  const hasSeed = initialData !== undefined;
  return useQuery<number, Error>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const response = await apiClient.notifications.getUnreadCount();
      return response.data.count;
    },
    staleTime: hasSeed ? 1000 * 60 : 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: false,
    ...withInitialData(initialData),
  });
}

/**
 * Fetch a single notification by ID
 * @param id - The ID of the notification to fetch
 */
export function useNotification(id: string) {
  return useQuery<Notification, Error>({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: async () => {
      const response = await apiClient.notifications.getById(id);
      return response.data;
    },
    enabled: !!id, // Only run query if ID is available
  });
}

/**
 * Update notification mutation (mark as read/unread)
 */
export function useUpdateNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    Notification,
    Error,
    UpdateNotificationInput,
    {
      previousNotification?: Notification;
      previousNotifications?: Notification[];
      previousCount?: number;
    }
  >({
    mutationFn: async (updateData) => {
      const response = await apiClient.notifications.update(
        updateData.id,
        updateData
      );
      return response.data;
    },
    onMutate: async (updateData) => {
      // Cancel any outgoing refetches for the notification queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.detail(updateData.id),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      // Snapshot the previous values
      const previousNotification = queryClient.getQueryData<Notification>(
        queryKeys.notifications.detail(updateData.id)
      );
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.lists()
      );
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount()
      );

      // Optimistically update the notification
      if (previousNotification) {
            queryClient.setQueryData<Notification>(
              queryKeys.notifications.detail(updateData.id),
              (old): Notification | undefined => {
                if (!old && previousNotification) return previousNotification;
                if (!old) return previousNotification;
                return {
                  ...old,
                  read: updateData.read ?? old.read,
                  readAt:
                    updateData.read === true
                      ? new Date()
                      : null,
                };
              }
            );
      }

      // Optimistically update notifications list
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.lists(),
          (old) => {
            if (!old) return previousNotifications;
            return old.map((notification) =>
              notification.id === updateData.id
                ? {
                    ...notification,
                    read: updateData.read ?? notification.read,
                    readAt:
                      updateData.read === true
                        ? new Date()
                        : null,
                  }
                : notification
            );
          }
        );
      }

      // Optimistically update unread count
      if (previousCount !== undefined && updateData.read !== undefined) {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unreadCount(),
          (old) => {
            if (old === undefined) return previousCount;
            if (updateData.read === true && old > 0) {
              return old - 1;
            } else if (updateData.read === false) {
              return old + 1;
            }
            return old;
          }
        );
      }

      return {
        previousNotification,
        previousNotifications,
        previousCount,
      };
    },
    onError: (error, updateData, context) => {
      // Rollback to previous values on error
      if (context?.previousNotification) {
        queryClient.setQueryData(
          queryKeys.notifications.detail(updateData.id),
          context.previousNotification
        );
      }
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          context.previousCount
        );
      }
      toast({
        title: "Update Failed",
        description:
          getErrorMessage(error) || "Failed to update notification",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });
}

/**
 * Mark all notifications as read mutation
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ count: number }, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.notifications.markAllAsRead();
      return response.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      // Optimistically update all notifications to read
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.lists(),
        (old) => {
          if (!old) return old;
          return old.map((notification) => ({
            ...notification,
            read: true,
            readAt: new Date(),
          }));
        }
      );

      // Optimistically set unread count to 0
      queryClient.setQueryData<number>(
        queryKeys.notifications.unreadCount(),
        0
      );
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description:
          getErrorMessage(error) || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "All Read!",
        description: `Marked ${data.count} notification(s) as read.`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });
}

/**
 * Delete notification mutation
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    void,
    Error,
    string,
    { previousNotifications?: Notification[]; previousCount?: number }
  >({
    mutationFn: async (notificationId) => {
      try {
        await apiClient.notifications.delete(notificationId);
      } catch (error) {
        // Idempotent: already gone / unauthorized → treat as success (optimistic UI already removed)
        if (isExpectedClientError(error)) {
          return;
        }
        throw error;
      }
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.detail(notificationId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.lists()
      );
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount()
      );

      // Optimistically remove notification from list
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.lists(),
        (old) => {
          if (!old) return previousNotifications || [];
          const filtered = old.filter((n) => n.id !== notificationId);
          return filtered;
        }
      );

      // Optimistically update unread count (decrement if notification was unread)
      const notification = previousNotifications?.find(
        (n) => n.id === notificationId
      );
      if (notification && !notification.read && previousCount !== undefined) {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unreadCount(),
          (old) => {
            if (old === undefined) return previousCount;
            return Math.max(0, old - 1);
          }
        );
      }

      return { previousNotifications, previousCount };
    },
    onError: (error, notificationId, context) => {
      // Rollback to previous values on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          context.previousCount
        );
      }
      toast({
        title: "Delete Failed",
        description:
          getErrorMessage(error) || "Failed to delete notification",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Deleted!",
        description: "Notification has been deleted successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });
}
