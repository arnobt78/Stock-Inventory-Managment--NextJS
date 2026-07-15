/**
 * Authentication query hooks
 * TanStack Query hooks for authentication operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage, isAuthError } from "@/lib/api";
import { queryKeys, invalidateAllRelatedQueries } from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type { LoginInput, RegisterInput, LoginResponse } from "@/types";

/**
 * Get current session
 * Query hook for fetching the current user session
 */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async () => {
      const response = await apiClient.auth.getSession();
      return response.data;
    },
    // Always revalidate session; lists keep global refetchOnWindowFocus: false (REQ-0133)
    staleTime: 0,
    // REQ-0134: detect expired JWT on tab return without refetching all data queries
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (isAuthError(error)) {
        return false; // Don't retry on auth errors
      }
      return failureCount < 3;
    },
  });
}

/**
 * Login mutation
 * Mutation hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiClient.auth.login(data);
      return response.data;
    },
    onSuccess: (loginResponse: LoginResponse) => {
      // Invalidate session and all data so new user sees fresh data immediately
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.session(),
      });
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      return loginResponse;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

/**
 * Register mutation
 * Mutation hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await apiClient.auth.register(data);
      return response.data;
    },
    onSuccess: (user) => {
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      return user;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

/**
 * Logout mutation
 * Mutation hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await apiClient.auth.logout();
    },
    onSuccess: () => {
      // Full cache wipe on logout (stronger than invalidate — no stale user data)
      queryClient.clear();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

