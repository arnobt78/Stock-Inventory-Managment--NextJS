/**
 * Invoice Query Hooks
 * TanStack Query hooks for fetching and managing invoices
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage, isAxiosError } from "@/lib/api";
import {
  queryKeys,
  invalidateAfterOrderGraphChange,
  cancelOrRemoveDetailQuery,
  withInitialData,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "@/types";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

/**
 * Fetch all invoices for the authenticated user
 * @param filters - Optional filters for invoices
 */
export function useInvoices(
  filters?: InvoiceFilters,
  initialData?: Invoice[] | InvoiceForPage[],
) {
  return useQuery<Invoice[], Error>({
    queryKey: queryKeys.invoices.list(
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: async () => {
      const response = await apiClient.invoices.getAll(filters);
      return response.data;
    },
    ...withInitialData(initialData as Invoice[] | undefined),
  });
}

/**
 * Fetch client invoices (invoices for orders that contain products owned by the current user).
 * Used on admin "Client Invoices" page.
 */
export function useClientInvoices(
  filters?: InvoiceFilters,
  initialData?: Invoice[],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const { scope: _scope, ...clientFilters } = filters ?? {};
  const queryFilters =
    Object.keys(clientFilters).length > 0 ? clientFilters : undefined;

  return useQuery<Invoice[], Error>({
    queryKey: queryKeys.clientInvoices.list(
      queryFilters as Record<string, unknown> | undefined,
    ),
    queryFn: async () => {
      const response = await apiClient.admin.getClientInvoices(queryFilters);
      return response.data;
    },
    enabled,
    ...withInitialData(initialData),
  });
}

/**
 * Fetch a single invoice by ID
 * @param id - The ID of the invoice to fetch
 */
export function useInvoice(id: string, initialData?: Invoice) {
  return useQuery<Invoice, Error>({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: async () => {
      const response = await apiClient.invoices.getById(id);
      return response.data;
    },
    enabled: !!id, // Only run query if ID is available
    ...withInitialData(initialData),
  });
}

/**
 * Create a new invoice from an order
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Invoice, Error, CreateInvoiceInput>({
    mutationFn: async (newInvoiceData) => {
      const response = await apiClient.invoices.create(newInvoiceData);
      return response.data;
    },
    onSuccess: (data: Invoice) => {
      // Update the query cache with new invoice data
      queryClient.setQueryData<Invoice>(
        queryKeys.invoices.detail(data.id),
        data,
      );

      invalidateAfterOrderGraphChange(queryClient);

      toast({
        title: "Invoice Created!",
        description: `Invoice #${data.invoiceNumber} has been successfully created.`,
      });
    },
    onError: (error) => {
      const isDuplicate =
        isAxiosError(error) && error.response?.status === 409;
      toast({
        title: isDuplicate
          ? "Invoice already exists"
          : "Invoice Creation Failed",
        description:
          getErrorMessage(error) ||
          "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Update an existing invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    Invoice,
    Error,
    UpdateInvoiceInput,
    { previousInvoice: Invoice | undefined }
  >({
    mutationFn: async (updatedInvoiceData) => {
      const response = await apiClient.invoices.update(
        updatedInvoiceData.id,
        updatedInvoiceData,
      );
      return response.data;
    },
    onMutate: async (updatedInvoiceData) => {
      // Cancel any outgoing refetches for the invoice detail query
      await queryClient.cancelQueries({
        queryKey: queryKeys.invoices.detail(updatedInvoiceData.id),
      });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData<Invoice>(
        queryKeys.invoices.detail(updatedInvoiceData.id),
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Invoice>(
        queryKeys.invoices.detail(updatedInvoiceData.id),
        (old) => {
          if (!old) return previousInvoice;
          return {
            ...old,
            ...updatedInvoiceData,
            // Ensure dates are handled correctly if they are part of the update
            dueDate: updatedInvoiceData.dueDate
              ? new Date(updatedInvoiceData.dueDate)
              : old.dueDate,
            sentAt: updatedInvoiceData.sentAt
              ? new Date(updatedInvoiceData.sentAt)
              : old.sentAt,
            paidAt: updatedInvoiceData.paidAt
              ? new Date(updatedInvoiceData.paidAt)
              : old.paidAt,
            cancelledAt: updatedInvoiceData.cancelledAt
              ? new Date(updatedInvoiceData.cancelledAt)
              : old.cancelledAt,
          };
        },
      );

      return { previousInvoice };
    },
    onError: (error, updatedInvoiceData, context) => {
      // Rollback to the previous value on error
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          queryKeys.invoices.detail(updatedInvoiceData.id),
          context.previousInvoice,
        );
      }
      toast({
        title: "Invoice Update Failed",
        description:
          getErrorMessage(error) ||
          "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      invalidateAfterOrderGraphChange(queryClient);
    },
    onSuccess: (data) => {
      toast({
        title: "Invoice Updated!",
        description: `Invoice #${data.invoiceNumber} has been successfully updated.`,
      });
    },
  });
}

/**
 * Delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (invoiceId) => {
      await apiClient.invoices.delete(invoiceId);
    },
    onSuccess: (_, invoiceId) => {
      cancelOrRemoveDetailQuery(
        queryClient,
        queryKeys.invoices.detail(invoiceId),
      );
      invalidateAfterOrderGraphChange(queryClient);

      toast({
        title: "Invoice Deleted!",
        description: "The invoice has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Invoice Deletion Failed",
        description:
          getErrorMessage(error) ||
          "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Send invoice via email
 */
export function useSendInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    { success: boolean; message: string; invoice: Invoice },
    Error,
    string
  >({
    mutationFn: async (invoiceId) => {
      const response = await apiClient.invoices.send(invoiceId);
      return response.data;
    },
    onSuccess: (data, invoiceId) => {
      // Update the invoice in cache with sent status
      queryClient.setQueryData<Invoice>(
        queryKeys.invoices.detail(invoiceId),
        data.invoice,
      );

      invalidateAfterOrderGraphChange(queryClient);

      toast({
        title: "Invoice Sent!",
        description: `Invoice #${data.invoice.invoiceNumber} has been sent successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Invoice",
        description:
          getErrorMessage(error) || "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    },
  });
}
