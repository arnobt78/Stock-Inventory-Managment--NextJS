/**
 * Invoice Actions Component
 * Provides view, edit, delete, and send actions for invoice table rows.
 * REQ-0062: cross-domain order actions — View Order for all roles,
 * Cancel Order for admin/owner; Edit/Delete invoice role-gated like orders.
 */

"use client";

import React, { useState } from "react";
import { Invoice } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useDeleteInvoice,
  useDeleteOrder,
  useSendInvoice,
} from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { AlertDialogWrapper } from "@/components/dialogs";

interface InvoiceActionsProps {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  /** When set (e.g. "/admin/invoices"), View link uses {detailHrefBase}/{id} */
  detailHrefBase?: string;
}

/**
 * Invoice Actions Component
 * Provides view, edit, delete, and send actions for invoice table rows
 * Matches OrderActions/ProductActions pattern
 */
export default function InvoiceActions({
  invoice,
  onEdit,
  detailHrefBase,
}: InvoiceActionsProps) {
  const { user } = useAuth();
  const deleteInvoiceMutation = useDeleteInvoice();
  const deleteOrderMutation = useDeleteOrder();
  const sendInvoiceMutation = useSendInvoice();
  const isDeleting = deleteInvoiceMutation.isPending;
  const isCancellingOrder = deleteOrderMutation.isPending;
  const isSending = sendInvoiceMutation.isPending;

  // Invoice/order mutations are admin/owner-only (REQ-0062 — match order table gating)
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const disableInvoiceMutations = isSupplierRole || isClientRole;

  // Order detail routes follow the invoice detail base (admin pages → /admin/orders)
  const orderHrefBase = detailHrefBase?.startsWith("/admin")
    ? "/admin/orders"
    : "/orders";

  // Alert dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cancelOrderDialogOpen, setCancelOrderDialogOpen] = useState(false);

  // Handle Delete Invoice
  const handleDeleteInvoice = async () => {
    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      // Error toast is handled by the mutation hook
    }
  };

  // Handle Edit Invoice
  const handleEditInvoice = () => {
    try {
      onEdit(invoice);
    } catch (error) {
      // Error handling
    }
  };

  // Handle Send Invoice
  const handleSendInvoice = async () => {
    try {
      await sendInvoiceMutation.mutateAsync(invoice.id);
      setSendDialogOpen(false);
    } catch (error) {
      // Error toast is handled by the mutation hook
    }
  };

  // Handle Cancel Order (REQ-0062 — API guards already-cancelled orders)
  const handleCancelOrder = async () => {
    try {
      await deleteOrderMutation.mutateAsync(invoice.orderId);
      setCancelOrderDialogOpen(false);
    } catch (error) {
      // Error toast is handled by the mutation hook
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-md shadow-lg"
        >
          <DropdownMenuItem asChild>
            <Link
              href={
                detailHrefBase
                  ? `${detailHrefBase}/${invoice.id}`
                  : `/invoices/${invoice.id}`
              }
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEditInvoice}
            disabled={disableInvoiceMutations}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Invoice
          </DropdownMenuItem>
          {invoice.status === "draft" && (
            <DropdownMenuItem
              onClick={() => setSendDialogOpen(true)}
              disabled={isSending || disableInvoiceMutations}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : "Send Invoice"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* REQ-0062: linked order actions — every invoice row has an orderId */}
          <DropdownMenuItem asChild>
            <Link
              href={`${orderHrefBase}/${invoice.orderId}`}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              View Order
            </Link>
          </DropdownMenuItem>
          {!disableInvoiceMutations && invoice.status !== "cancelled" && (
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => setCancelOrderDialogOpen(true)}
              disabled={isCancellingOrder}
            >
              <XCircle className="h-4 w-4" />
              {isCancellingOrder ? "Cancelling..." : "Cancel Order"}
            </DropdownMenuItem>
          )}
          {invoice.status !== "cancelled" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting || disableInvoiceMutations}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Invoice"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={isDeleting}
        onAction={handleDeleteInvoice}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Send Confirmation Dialog */}
      <AlertDialogWrapper
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Send Invoice"
        description={`Are you sure you want to send invoice ${invoice.invoiceNumber} via email?`}
        actionLabel="Send"
        actionLoadingLabel="Sending..."
        isLoading={isSending}
        onAction={handleSendInvoice}
        onCancel={() => setSendDialogOpen(false)}
        actionVariant="default"
      />

      {/* Cancel linked order confirmation (REQ-0062) */}
      <AlertDialogWrapper
        open={cancelOrderDialogOpen}
        onOpenChange={setCancelOrderDialogOpen}
        title="Cancel Order"
        description={`Are you sure you want to cancel the order linked to invoice ${invoice.invoiceNumber}? Stock will be restored and the invoice cancelled. This action cannot be undone.`}
        actionLabel="Cancel Order"
        actionLoadingLabel="Cancelling..."
        isLoading={isCancellingOrder}
        onAction={handleCancelOrder}
        onCancel={() => setCancelOrderDialogOpen(false)}
      />
    </>
  );
}
