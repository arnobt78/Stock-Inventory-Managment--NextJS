/**
 * Order Actions Component
 * Provides edit and delete actions for order table rows.
 * REQ-0061: situation-based invoice actions — Create Invoice when the order
 * has none (admin/owner), View/Edit/Delete Invoice when linked.
 */

"use client";

import React, { useState } from "react";
import { Order } from "@/types";
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
  Star,
  FilePlus2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useDeleteOrder, useDeleteInvoice } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { AlertDialogWrapper } from "@/components/dialogs";

interface OrderActionsProps {
  order: Order;
  /**
   * REQ-0169 — optional; when omitted (e.g. My Activity embed), hide Edit Order.
   * View / Cancel / invoice actions still work via links + mutation hooks.
   */
  onEdit?: (order: Order) => void;
  /** When set (e.g. "/admin/orders"), View link goes to {detailHrefBase}/{order.id} */
  detailHrefBase?: string;
  /** Open InvoiceDialog create mode pre-selected with this order (REQ-0061) */
  onCreateInvoice?: (order: Order) => void;
}

/**
 * Order Actions Component
 * Provides edit and delete actions for order table rows
 * Matches CategoryActions/ProductActions pattern
 */
export default function OrderActions({
  order,
  onEdit,
  detailHrefBase,
  onCreateInvoice,
}: OrderActionsProps) {
  const { user } = useAuth();
  const deleteOrderMutation = useDeleteOrder();
  const deleteInvoiceMutation = useDeleteInvoice();
  const isDeleting = deleteOrderMutation.isPending;
  const isDeletingInvoice = deleteInvoiceMutation.isPending;
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const disableOrderActions = isSupplierRole || isClientRole;
  /** Invoice create/edit/delete is admin/owner-only; client + supplier get View only */
  const disableInvoiceMutations = disableOrderActions;

  // Invoice detail routes follow the order detail base (admin pages → /admin/invoices)
  const invoiceHrefBase = detailHrefBase?.startsWith("/admin")
    ? "/admin/invoices"
    : "/invoices";
  const linkedInvoice = order.invoiceForOrder ?? null;

  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (
      window.confirm(
        `Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteOrderMutation.mutateAsync(order.id);
      } catch (error) {
        // Error toast is handled by the mutation hook
      }
    }
  };

  // Handle Edit Order — no-op when onEdit not provided (REQ-0169 embed tables)
  const handleEditOrder = () => {
    if (!onEdit) return;
    try {
      onEdit(order);
    } catch {
      // Error handling
    }
  };

  // Handle Delete Invoice (existing 409/toast handling lives in the mutation hook)
  const handleDeleteInvoice = async () => {
    if (!linkedInvoice) return;
    try {
      await deleteInvoiceMutation.mutateAsync(linkedInvoice.id);
      setDeleteInvoiceDialogOpen(false);
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
                  ? `${detailHrefBase}/${order.id}`
                  : `/orders/${order.id}`
              }
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {/* REQ-0210 — hide Edit on cancelled (status/payment must not be manipulated) */}
          {onEdit != null && order.status !== "cancelled" && (
            <DropdownMenuItem
              onClick={handleEditOrder}
              disabled={disableOrderActions}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Order
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* REQ-0061: situation-based invoice actions */}
          {linkedInvoice ? (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`${invoiceHrefBase}/${linkedInvoice.id}`}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Invoice
                </Link>
              </DropdownMenuItem>
              {/* REQ-0210 — no edit/delete when order or invoice cancelled */}
              {!disableInvoiceMutations &&
                order.status !== "cancelled" &&
                linkedInvoice.status !== "cancelled" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`${invoiceHrefBase}/${linkedInvoice.id}`}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Invoice
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={() => setDeleteInvoiceDialogOpen(true)}
                      disabled={isDeletingInvoice}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeletingInvoice ? "Deleting..." : "Delete Invoice"}
                    </DropdownMenuItem>
                  </>
                )}
            </>
          ) : (
            onCreateInvoice &&
            !disableInvoiceMutations &&
            order.status !== "cancelled" && (
              <DropdownMenuItem
                onClick={() => onCreateInvoice(order)}
                className="flex items-center gap-2"
              >
                <FilePlus2 className="h-4 w-4" />
                Create Invoice
              </DropdownMenuItem>
            )
          )}
          <DropdownMenuSeparator />
          {order.paymentStatus === "paid" ? (
            <DropdownMenuItem asChild>
              <Link
                href={
                  detailHrefBase
                    ? `${detailHrefBase}/${order.id}#reviews`
                    : `/orders/${order.id}#reviews`
                }
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Write / Edit review
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled
              className="flex items-center gap-2 text-muted-foreground"
              title="Available after order is paid"
            >
              <Star className="h-4 w-4" />
              Write / Edit review
            </DropdownMenuItem>
          )}
          {order.status !== "cancelled" && (
            <>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={handleCancelOrder}
                disabled={isDeleting || disableOrderActions}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Cancelling..." : "Cancel Order"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete linked invoice confirmation (REQ-0061) */}
      {linkedInvoice && (
        <AlertDialogWrapper
          open={deleteInvoiceDialogOpen}
          onOpenChange={setDeleteInvoiceDialogOpen}
          title="Delete Invoice"
          description={`Are you sure you want to delete invoice ${linkedInvoice.invoiceNumber} for order ${order.orderNumber}? This action cannot be undone.`}
          actionLabel="Delete"
          actionLoadingLabel="Deleting..."
          isLoading={isDeletingInvoice}
          onAction={handleDeleteInvoice}
          onCancel={() => setDeleteInvoiceDialogOpen(false)}
        />
      )}
    </>
  );
}
