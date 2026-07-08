/**
 * Email Preferences query hooks
 * TanStack Query hooks for email preferences fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { invalidateAllRelatedQueries } from "@/lib/react-query/invalidate-all";
import { useToast } from "@/hooks/use-toast";
import type {
  EmailPreferences,
  UpdateEmailPreferencesInput,
} from "@/types";

/**
 * Fetch user email preferences
 * Query hook for getting the user's email notification preferences
 */
export function useEmailPreferences(initialData?: EmailPreferences) {
  return useQuery({
    queryKey: queryKeys.user.emailPreferences(),
    queryFn: async () => {
      const response = await apiClient.user.getEmailPreferences();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/**
 * Update email preferences mutation
 * Mutation hook for updating user email notification preferences
 */
export function useUpdateEmailPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateEmailPreferencesInput) => {
      const response = await apiClient.user.updateEmailPreferences(data);
      return response.data;
    },
    onSuccess: (data: EmailPreferences) => {
      // Update the query cache with new preferences
      queryClient.setQueryData<EmailPreferences>(
        queryKeys.user.emailPreferences(),
        data
      );
      // Invalidate so all user-related data refetches and UI stays in sync
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      invalidateAllRelatedQueries(queryClient);

      // Show success toast
      toast({
        title: "Email Preferences Updated",
        description: "Your email notification preferences have been saved successfully.",
      });
    },
    onError: (error: unknown) => {
      // Show error toast
      toast({
        title: "Update Failed",
        description: getErrorMessage(error) || "Failed to update email preferences. Please try again.",
        variant: "destructive",
      });
    },
  });
}
