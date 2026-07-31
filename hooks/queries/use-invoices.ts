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
  patchDetailCache,
  patchDetailCacheMerge,
  patchListCaches,
  patchOrderGraphListCaches,
  patchLinkedOrderFromInvoiceMoney,
  patchCommittedAfterOrderMoneySettle,
  removeFromListCaches,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
  Order,
} from "@/types";
import type { InvoiceForPage } from "@/lib/server/invoices-data";
import type { QueryClient } from "@tanstack/react-query";
import { densifyInvoiceFromOrder } from "@/lib/invoices/densify-invoice-from-order";
import { resolveInvoiceStatusAt } from "@/lib/invoices/invoice-status-display-date";

/** REQ-0136 — keep Status column date in sync after CRUD (draft/sent/paid/…). */
function withResolvedInvoiceStatusAt(invoice: Invoice): Invoice {
  const statusAt = resolveInvoiceStatusAt(invoice);
  if (statusAt == null) return invoice;
  return { ...invoice, statusAt };
}

/** Snapshot linked order before money patches (REQ-0222 settle densify). */
function getCachedOrderCommittedSnapshot(
  queryClient: QueryClient,
  orderId: string | null | undefined,
): Order | null {
  if (!orderId) return null;
  return (
    queryClient.getQueryData<Order>(queryKeys.orders.detail(orderId)) ??
    queryClient.getQueryData<Order>(queryKeys.clientOrders.detail(orderId)) ??
    null
  );
}

/** REQ-0222 — patch reserved when invoice money/status fulfills a pending order. */
function settleCommittedFromInvoice(
  queryClient: QueryClient,
  invoice: Invoice,
  prevOrder: Order | null,
): void {
  if (!invoice.orderId || !prevOrder) return;
  // next* from cache AFTER patchLinkedOrderFromInvoiceMoney (paid/partial → confirmed)
  const nextOrder = getCachedOrderCommittedSnapshot(
    queryClient,
    invoice.orderId,
  );
  patchCommittedAfterOrderMoneySettle(queryClient, {
    orderId: invoice.orderId,
    prevOrder,
    nextStatus: nextOrder?.status ?? prevOrder.status,
    nextPaymentStatus: nextOrder?.paymentStatus ?? prevOrder.paymentStatus,
  });
}

/** Resolve order from detail or any list cache, then densify invoice row. */
function densifyInvoiceRowFromOrderCache(
  queryClient: QueryClient,
  invoice: Invoice,
): Invoice {
  const detail = queryClient.getQueryData<Order>(
    queryKeys.orders.detail(invoice.orderId),
  );
  let order = detail;
  if (!order) {
    const lists = queryClient.getQueriesData<Order[]>({
      queryKey: queryKeys.orders.all,
      exact: false,
    });
    for (const [, rows] of lists) {
      if (!Array.isArray(rows)) continue;
      const hit = rows.find((r) => r.id === invoice.orderId);
      if (hit) {
        order = hit;
        break;
      }
    }
  }
  return densifyInvoiceFromOrder(invoice, order);
}

/**
 * Optimistic invoice merge — coerces date fields from UpdateInvoiceInput strings.
 * REQ-0125 / REQ-0153 — recompute amountDue when amountPaid or total changes.
 */
function mergeOptimisticInvoiceUpdate(
  old: Invoice | undefined,
  partial: UpdateInvoiceInput,
  fallback?: Invoice,
): Invoice | undefined {
  const base = old ?? fallback;
  if (!base) return undefined;

  const next: Invoice = {
    ...base,
    ...partial,
    dueDate: partial.dueDate ? new Date(partial.dueDate) : base.dueDate,
    sentAt: partial.sentAt ? new Date(partial.sentAt) : base.sentAt,
    paidAt: partial.paidAt ? new Date(partial.paidAt) : base.paidAt,
    cancelledAt: partial.cancelledAt
      ? new Date(partial.cancelledAt)
      : base.cancelledAt,
  };

  // REQ-0153 — keep Total / Due / order patch coherent before server responds
  const moneyTouched =
    partial.amountPaid !== undefined ||
    partial.total !== undefined ||
    partial.tax !== undefined ||
    partial.shipping !== undefined ||
    partial.discount !== undefined ||
    partial.amountDue !== undefined;
  if (moneyTouched) {
    const amountPaid = Number(next.amountPaid ?? 0);
    const total = Number(next.total ?? 0);
    if (partial.amountDue === undefined) {
      next.amountDue = Math.max(0, total - amountPaid);
    }
  }

  // REQ-0136 — Status column date under badge after dropdown status change
  next.statusAt = resolveInvoiceStatusAt(next);

  return next;
}

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
  const queryFilters =
    filters && Object.keys(filters).length > 0 ? filters : undefined;

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
      // REQ-0211 — densify + prepend only invoice lists (never orders — wrong id)
      const densified = withResolvedInvoiceStatusAt(
        densifyInvoiceRowFromOrderCache(queryClient, data),
      );
      patchDetailCache(
        queryClient,
        queryKeys.invoices.detail(densified.id),
        densified,
      );
      patchListCaches(queryClient, queryKeys.invoices.all, densified, {
        prependIfMissing: true,
      });
      patchListCaches(queryClient, queryKeys.clientInvoices.all, densified, {
        prependIfMissing: true,
      });
      // REQ-0153 — link invoiceForOrder on order rows (merge, not prepend)
      patchLinkedOrderFromInvoiceMoney(queryClient, densified);

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
 * Update an existing invoice.
 * Patch-then-invalidate: optimistic detail + list on onMutate; server row on onSuccess.
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    Invoice,
    Error,
    UpdateInvoiceInput,
    {
      previousInvoice: Invoice | undefined;
      /** Order before money/status patches — required for REQ-0222 deltas. */
      prevOrder: Order | null;
    }
  >({
    mutationFn: async (updatedInvoiceData) => {
      const response = await apiClient.invoices.update(
        updatedInvoiceData.id,
        updatedInvoiceData,
      );
      return response.data;
    },
    onMutate: async (updatedInvoiceData) => {
      const detailKey = queryKeys.invoices.detail(updatedInvoiceData.id);
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousInvoice = queryClient.getQueryData<Invoice>(detailKey);
      const prevOrder = getCachedOrderCommittedSnapshot(
        queryClient,
        previousInvoice?.orderId,
      );

      const optimistic = mergeOptimisticInvoiceUpdate(
        previousInvoice,
        updatedInvoiceData,
        previousInvoice,
      );

      if (optimistic) {
        patchDetailCacheMerge(queryClient, detailKey, () => optimistic);
        patchOrderGraphListCaches(queryClient, optimistic);
        // REQ-0153 — optimistic order Payment badge + invoiceForOrder money
        patchLinkedOrderFromInvoiceMoney(queryClient, optimistic);
      }

      return { previousInvoice, prevOrder };
    },
    onError: (error, updatedInvoiceData, context) => {
      if (context?.previousInvoice) {
        patchDetailCache(
          queryClient,
          queryKeys.invoices.detail(updatedInvoiceData.id),
          context.previousInvoice,
        );
        patchOrderGraphListCaches(queryClient, context.previousInvoice);
        // REQ-0153 — rollback linked order payment patch
        patchLinkedOrderFromInvoiceMoney(
          queryClient,
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
    onSuccess: (data, _vars, context) => {
      const withStatusAt = withResolvedInvoiceStatusAt(data);
      patchDetailCache(
        queryClient,
        queryKeys.invoices.detail(withStatusAt.id),
        withStatusAt,
      );
      patchOrderGraphListCaches(queryClient, withStatusAt);
      // REQ-0153 — confirm linked order from server invoice money
      patchLinkedOrderFromInvoiceMoney(queryClient, withStatusAt);
      // REQ-0222 — reserved densify on fulfill (use pre-mutate order snapshot)
      settleCommittedFromInvoice(
        queryClient,
        withStatusAt,
        context?.prevOrder ?? null,
      );
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
      removeFromListCaches(queryClient, queryKeys.invoices.all, invoiceId);
      removeFromListCaches(queryClient, queryKeys.clientInvoices.all, invoiceId);
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
      const withStatusAt = withResolvedInvoiceStatusAt(data.invoice);
      const prevOrder = getCachedOrderCommittedSnapshot(
        queryClient,
        withStatusAt.orderId,
      );
      patchDetailCache(
        queryClient,
        queryKeys.invoices.detail(invoiceId),
        withStatusAt,
      );
      patchOrderGraphListCaches(queryClient, withStatusAt);
      // REQ-0153 — keep order invoiceForOrder / payment badge in sync after send
      patchLinkedOrderFromInvoiceMoney(queryClient, withStatusAt);
      // REQ-0222 — no-op unless send somehow fulfills; safe shared path
      settleCommittedFromInvoice(queryClient, withStatusAt, prevOrder);

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
