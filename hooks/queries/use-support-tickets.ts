/**
 * Support Ticket query hooks
 * TanStack Query hooks for support ticket data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  invalidateAllRelatedQueries,
  cancelOrRemoveDetailQuery,
  withInitialData,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  SupportTicket,
  SupportTicketReply,
  CreateSupportTicketInput,
  CreateSupportTicketReplyInput,
  UpdateSupportTicketInput,
} from "@/types";

export type SupportTicketViewFilter =
  | "all"
  | "assigned_to_me"
  | "created_by_me";

export function useSupportTickets(
  view?: SupportTicketViewFilter,
  initialData?: SupportTicket[],
) {
  return useQuery({
    queryKey: queryKeys.supportTickets.list({ view: view ?? "all" }),
    queryFn: async () => {
      const response = await apiClient.supportTickets.getAll(
        view && view !== "all" ? { view } : undefined,
      );
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

export function useSupportTicket(id: string, initialData?: SupportTicket) {
  return useQuery({
    queryKey: queryKeys.supportTickets.detail(id),
    queryFn: async () => {
      const response = await apiClient.supportTickets.getById(id);
      return response.data;
    },
    enabled: !!id,
    ...withInitialData(initialData),
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSupportTicketInput) => {
      const response = await apiClient.supportTickets.create(data);
      return response.data;
    },
    onSuccess: (data: SupportTicket) => {
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Ticket created",
        description: `Support ticket "${data.subject}" has been created.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Create failed",
        description:
          getErrorMessage(error) || "Failed to create support ticket.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSupportTicketInput;
    }) => {
      const response = await apiClient.supportTickets.update(id, data);
      return response.data;
    },
    onSuccess: (data: SupportTicket) => {
      queryClient.setQueryData<SupportTicket>(
        queryKeys.supportTickets.detail(data.id),
        data,
      );
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Ticket updated",
        description: `Support ticket "${data.subject}" has been updated.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description:
          getErrorMessage(error) || "Failed to update support ticket.",
        variant: "destructive",
      });
    },
  });
}

export function useSupportTicketReplies(
  ticketId: string,
  initialData?: SupportTicketReply[],
) {
  return useQuery({
    queryKey: [...queryKeys.supportTickets.detail(ticketId), "replies"],
    queryFn: async () => {
      const response = await apiClient.supportTickets.getReplies(ticketId);
      return response.data;
    },
    enabled: !!ticketId,
    ...withInitialData(initialData),
  });
}

export function useCreateSupportTicketReply(ticketId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSupportTicketReplyInput) => {
      const response = await apiClient.supportTickets.createReply(
        ticketId,
        data,
      );
      return response.data;
    },
    onSuccess: (data: SupportTicketReply) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets.detail(ticketId),
      });
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Reply sent",
        description: "Your reply has been added to the ticket.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Reply failed",
        description:
          getErrorMessage(error) || "Failed to add reply.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSupportTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.supportTickets.delete(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.supportTickets.detail(id),
      );
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Ticket deleted",
        description: "Support ticket has been deleted.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description:
          getErrorMessage(error) || "Failed to delete support ticket.",
        variant: "destructive",
      });
    },
  });
}
