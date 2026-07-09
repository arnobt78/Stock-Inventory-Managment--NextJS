/**
 * Invoice Actions Component
 * Provides view, edit, delete, and send actions for invoice table rows
 */

"use client";

import React, { useState } from "react";
import { Invoice } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2, Send, Copy } from "lucide-react";
import Link from "next/link";
import { useDeleteInvoice, useSendInvoice } from "@/hooks/queries";
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
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const isDeleting = deleteInvoiceMutation.isPending;
  const isSending = sendInvoiceMutation.isPending;

  // Alert dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

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
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Invoice
          </DropdownMenuItem>
          {invoice.status === "draft" && (
            <DropdownMenuItem
              onClick={() => setSendDialogOpen(true)}
              disabled={isSending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : "Send Invoice"}
            </DropdownMenuItem>
          )}
          {invoice.status !== "cancelled" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
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
    </>
  );
}
