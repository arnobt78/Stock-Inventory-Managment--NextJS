/**
 * User Management (admin) query hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAllRelatedQueries,
  cancelOrRemoveDetailQuery,
  withInitialData,
  patchDetailCache,
  patchListCaches,
  removeFromListCaches,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  UserForAdmin,
  UserOverview,
  UpdateUserAdminInput,
  CreateUserAdminInput,
} from "@/types";

export type UserDetailForPage = UserForAdmin & { overview?: UserOverview };

export function useUsers(initialData?: UserForAdmin[]) {
  return useQuery({
    queryKey: queryKeys.userManagement.lists(),
    queryFn: async () => {
      const response = await apiClient.users.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

export function useUser(id: string, initialData?: UserDetailForPage) {
  return useQuery({
    queryKey: queryKeys.userManagement.detail(id),
    queryFn: async () => {
      const response = await apiClient.users.getById(id);
      return response.data;
    },
    enabled: !!id,
    ...withInitialData(initialData),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserAdminInput;
    }) => {
      const response = await apiClient.users.update(id, data);
      return response.data;
    },
    onSuccess: (data: UserForAdmin) => {
      patchDetailCache(
        queryClient,
        queryKeys.userManagement.detail(data.id),
        data,
      );
      patchListCaches(queryClient, queryKeys.userManagement.all, data);
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "User updated",
        description: `${data.name} (${data.email}) has been updated.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description: getErrorMessage(error) || "Failed to update user.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateUserAdminInput) => {
      const response = await apiClient.users.create(data);
      return response.data;
    },
    onSuccess: (data: UserForAdmin) => {
      patchDetailCache(
        queryClient,
        queryKeys.userManagement.detail(data.id),
        data,
      );
      patchListCaches(queryClient, queryKeys.userManagement.all, data, {
        prependIfMissing: true,
      });
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "User created",
        description: `${data.name} (${data.email}) has been created.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Create failed",
        description: getErrorMessage(error) || "Failed to create user.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.users.delete(id);
      return response.data;
    },
    onSuccess: (data: UserForAdmin) => {
      removeFromListCaches(queryClient, queryKeys.userManagement.all, data.id);
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.userManagement.detail(data.id),
      );
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "User deleted",
        description: `${data.name} (${data.email}) has been deleted.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error) || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });
}
