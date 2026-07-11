/**
 * Invoice Dialog Component
 * Dialog for generating invoices from orders
 * Uses indigo glassmorphic styling (different from orders/violet, products/rose)
 */

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePathname } from "next/navigation";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useOrders,
  useClientOrders,
} from "@/hooks/queries";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  type UpdateInvoiceFormData,
} from "@/lib/validations";
import type {
  CreateInvoiceInput,
  Invoice,
  Order,
  InvoiceStatus,
} from "@/types";
import { useAuth } from "@/contexts";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormNumberField } from "@/components/forms";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_INDIGO,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { OrderPickerCommand } from "./OrderPickerCommand";

interface InvoiceDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingInvoice?: Invoice | null;
  onEditInvoice?: (invoice: Invoice | null) => void;
  /** Pre-select an order in create mode (REQ-0061 — "Create Invoice" from order row/detail) */
  initialOrderId?: string;
}

const fmt = (v: number) =>
  `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Invoice Dialog Component
 * Generates invoices from orders
 * Uses indigo glassmorphic styling (border-indigo-400/30, shadow indigo)
 */
export default function InvoiceDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editingInvoice: externalEditingInvoice,
  onEditInvoice,
  initialOrderId,
}: InvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalEditingInvoice, setInternalEditingInvoice] =
    useState<Invoice | null>(null);
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state (tax/shipping/discount come from the selected order — not editable)
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(value);
      } else {
        setInternalOpen(value);
        controlledOnOpenChange?.(value);
      }
    },
    [isControlled, controlledOnOpenChange],
  );

  // Use external or internal editing invoice
  const editingInvoice =
    externalEditingInvoice !== undefined
      ? externalEditingInvoice
      : internalEditingInvoice;

  const setEditingInvoice =
    externalEditingInvoice !== undefined && onEditInvoice
      ? onEditInvoice
      : setInternalEditingInvoice;

  const pathname = usePathname();
  const isAdminInvoicesPage = pathname?.startsWith("/admin/invoices");
  const isAdmin = user?.role === "admin";
  // Client-orders leg also loads when pre-selecting an order (REQ-0061 —
  // "Create Invoice" from a client order row on /admin/orders)
  const needsClientOrdersLeg =
    isAdmin && (isAdminInvoicesPage || Boolean(initialOrderId));

  // Fetch orders only when dialog is open — avoids background admin/client-orders API calls
  const { data: selfOrders = [] } = useOrders(undefined, { enabled: open });
  const { data: clientOrders = [] } = useClientOrders(undefined, {
    enabled: open && needsClientOrdersLeg,
  });

  // /admin/invoices: show self + client orders with placer name
  // /invoices: show only self orders (product owner's own)
  const orders = React.useMemo(() => {
    if (!needsClientOrdersLeg) return selfOrders;
    const byId = new Map<string, Order & { _source?: string }>();
    selfOrders.forEach((o) => byId.set(o.id, { ...o, _source: "self" }));
    clientOrders.forEach((o) => {
      if (!byId.has(o.id)) byId.set(o.id, { ...o, _source: "client" });
    });
    return Array.from(byId.values());
  }, [needsClientOrdersLeg, selfOrders, clientOrders]);

  const availableOrders = orders.filter(
    (order) => order.status !== "cancelled",
  );

  // Use TanStack Query mutations
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const isCreating = createInvoiceMutation.isPending;
  const isUpdating = updateInvoiceMutation.isPending;
  const isSubmitting = isCreating || isUpdating;

  // ==================== EDIT INVOICE FORM ====================
  // Initialize edit form with invoice data
  const editFormMethods = useForm<UpdateInvoiceFormData>({
    resolver: zodResolver(updateInvoiceSchema),
    defaultValues: editingInvoice
      ? {
          id: editingInvoice.id,
          status: editingInvoice.status,
          amountPaid: editingInvoice.amountPaid,
          tax: editingInvoice.tax ?? undefined,
          shipping: editingInvoice.shipping ?? undefined,
          discount: editingInvoice.discount ?? undefined,
          total: editingInvoice.total,
          amountDue: editingInvoice.amountDue,
          dueDate: editingInvoice.dueDate
            ? new Date(editingInvoice.dueDate).toISOString().split("T")[0]
            : "",
          sentAt: editingInvoice.sentAt
            ? new Date(editingInvoice.sentAt).toISOString().split("T")[0]
            : "",
          paidAt: editingInvoice.paidAt
            ? new Date(editingInvoice.paidAt).toISOString().split("T")[0]
            : "",
          cancelledAt: editingInvoice.cancelledAt
            ? new Date(editingInvoice.cancelledAt).toISOString().split("T")[0]
            : "",
          paymentLink: editingInvoice.paymentLink || "",
          notes: editingInvoice.notes || "",
        }
      : {
          id: "",
          status: "draft",
          amountPaid: 0,
          tax: undefined,
          shipping: undefined,
          discount: undefined,
          total: 0,
          amountDue: 0,
          dueDate: "",
          sentAt: "",
          paidAt: "",
          cancelledAt: "",
          paymentLink: "",
          notes: "",
        },
  });

  const {
    reset: editReset,
    watch: editWatch,
    setValue: editSetValue,
  } = editFormMethods;

  // Reset edit form when invoice changes or dialog opens
  useEffect(() => {
    if (open && editingInvoice) {
      const taxVal = editingInvoice.tax ?? 0;
      const shippingVal = editingInvoice.shipping ?? 0;
      const discountVal = editingInvoice.discount ?? 0;
      const subtotalVal = editingInvoice.subtotal ?? 0;
      const totalVal = Math.max(
        0,
        subtotalVal + taxVal + shippingVal - discountVal,
      );
      editReset({
        id: editingInvoice.id,
        status: editingInvoice.status,
        amountPaid: editingInvoice.amountPaid,
        tax: taxVal,
        shipping: shippingVal,
        discount: discountVal,
        total: totalVal,
        amountDue: Math.max(0, totalVal - (editingInvoice.amountPaid ?? 0)),
        dueDate: editingInvoice.dueDate
          ? new Date(editingInvoice.dueDate).toISOString().split("T")[0]
          : "",
        sentAt: editingInvoice.sentAt
          ? new Date(editingInvoice.sentAt).toISOString().split("T")[0]
          : "",
        paidAt: editingInvoice.paidAt
          ? new Date(editingInvoice.paidAt).toISOString().split("T")[0]
          : "",
        cancelledAt: editingInvoice.cancelledAt
          ? new Date(editingInvoice.cancelledAt).toISOString().split("T")[0]
          : "",
        paymentLink: editingInvoice.paymentLink || "",
        notes: editingInvoice.notes || "",
      });
    } else if (open && !editingInvoice && externalEditingInvoice === null) {
      // Clear edit form when explicitly set to null
      editReset({
        id: "",
        status: "draft",
        amountPaid: 0,
        tax: undefined,
        shipping: undefined,
        discount: undefined,
        total: 0,
        amountDue: 0,
        dueDate: "",
        sentAt: "",
        paidAt: "",
        cancelledAt: "",
        paymentLink: "",
        notes: "",
      });
    }
  }, [open, editingInvoice, externalEditingInvoice, editReset]);

  // Derive total = subtotal + tax + shipping - discount when tax, shipping, or discount change (dynamic calculation)
  const watchedTax = editWatch("tax");
  const watchedShipping = editWatch("shipping");
  const watchedDiscount = editWatch("discount");
  useEffect(() => {
    if (!open || !editingInvoice) return;
    const subtotalVal = editingInvoice.subtotal ?? 0;
    const taxVal = Number(watchedTax) || 0;
    const shippingVal = Number(watchedShipping) || 0;
    const discountVal = Number(watchedDiscount) || 0;
    const totalVal = Math.max(
      0,
      subtotalVal + taxVal + shippingVal - discountVal,
    );
    editSetValue("total", totalVal);
  }, [
    open,
    editingInvoice,
    watchedTax,
    watchedShipping,
    watchedDiscount,
    editSetValue,
  ]);

  // Keep amountDue in sync with total - amountPaid in the edit form (dynamic calculation)
  const watchedAmountPaid = editWatch("amountPaid");
  const watchedTotal = editWatch("total");
  useEffect(() => {
    if (!open || !editingInvoice) return;
    const paid = Number(watchedAmountPaid) || 0;
    const tot = Number(watchedTotal) || 0;
    editSetValue("amountDue", Math.max(0, tot - paid));
  }, [open, editingInvoice, watchedAmountPaid, watchedTotal, editSetValue]);

  // Handle edit invoice submission
  const handleUpdateInvoice = async (data: UpdateInvoiceFormData) => {
    if (!editingInvoice) return;

    try {
      // Derive total = subtotal + tax + shipping - discount and amountDue = total - amountPaid (never send stale values)
      const subtotalVal = editingInvoice.subtotal ?? 0;
      const taxVal = data.tax ?? 0;
      const shippingVal = data.shipping ?? 0;
      const discountVal = data.discount ?? 0;
      const total = Math.max(
        0,
        subtotalVal + taxVal + shippingVal - discountVal,
      );
      const amountPaid = data.amountPaid ?? editingInvoice.amountPaid;
      const amountDue = Math.max(0, total - amountPaid);

      // Prepare update data - convert date strings to ISO strings for API
      const updateData = {
        id: data.id,
        status: data.status,
        amountPaid: data.amountPaid,
        tax: data.tax,
        shipping: data.shipping,
        discount: data.discount,
        total,
        amountDue,
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : undefined,
        sentAt: data.sentAt ? new Date(data.sentAt).toISOString() : undefined,
        paidAt: data.paidAt ? new Date(data.paidAt).toISOString() : undefined,
        cancelledAt: data.cancelledAt
          ? new Date(data.cancelledAt).toISOString()
          : undefined,
        paymentLink: data.paymentLink || undefined,
        notes: data.notes || undefined,
      };

      // Update invoice using TanStack Query mutation
      await updateInvoiceMutation.mutateAsync(updateData);

      // Clear editing state on success (toast is handled by mutation hook)
      if (externalEditingInvoice === undefined) {
        setInternalEditingInvoice(null);
      } else if (onEditInvoice) {
        onEditInvoice(null);
      }

      // Close dialog if controlled
      if (isControlled) {
        setOpen(false);
      } else {
        // For internal state, close after a brief delay
        setTimeout(() => {
          setOpen(false);
        }, 500);
      }
    } catch (error) {
      // Error toast is handled by the mutation hook
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (externalEditingInvoice === undefined) {
      setInternalEditingInvoice(null);
    } else if (onEditInvoice) {
      onEditInvoice(null);
    }
    // Close dialog if controlled
    if (isControlled) {
      setOpen(false);
    }
  };

  // ==================== CREATE INVOICE FORM ====================
  // Reset form when dialog closes
  useEffect(() => {
    if (!open && !editingInvoice && !isControlled) {
      setSelectedOrderId("");
      setDueDate("");
      setNotes("");
    }
  }, [open, editingInvoice, isControlled]);

  // REQ-0061: pre-select order when opened via "Create Invoice" from an order row/detail
  useEffect(() => {
    if (open && !editingInvoice && initialOrderId) {
      setSelectedOrderId(initialOrderId);
    }
  }, [open, editingInvoice, initialOrderId]);

  const selectedOrder = availableOrders.find(
    (order) => order.id === selectedOrderId,
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedOrderId) {
        toast({
          title: "Order Required",
          description: "Please select an order to generate an invoice.",
          variant: "destructive",
        });
        return;
      }

      if (!dueDate) {
        toast({
          title: "Due Date Required",
          description: "Please select a due date for the invoice.",
          variant: "destructive",
        });
        return;
      }

      // Use order's actual tax/shipping/discount (calculated at order time)
      const orderTax = selectedOrder?.tax ?? 0;
      const orderShipping = selectedOrder?.shipping ?? 0;
      const orderDiscount = selectedOrder?.discount ?? 0;

      const invoiceData: CreateInvoiceInput = {
        orderId: selectedOrderId,
        dueDate: new Date(dueDate).toISOString(),
        tax: orderTax > 0 ? orderTax : undefined,
        shipping: orderShipping > 0 ? orderShipping : undefined,
        discount: orderDiscount > 0 ? orderDiscount : undefined,
        notes: notes.trim() || undefined,
      };

      // Validate using Zod schema
      const validationResult = createInvoiceSchema.safeParse(invoiceData);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(". ");
        toast({
          title: "Validation Error",
          description:
            errorMessages || "Please fix the form errors before submitting.",
          variant: "destructive",
        });
        return;
      }

      try {
        await createInvoiceMutation.mutateAsync(invoiceData);

        // Reset form
        setSelectedOrderId("");
        setDueDate("");
        setNotes("");

        // Close dialog
        setOpen(false);
      } catch (error) {
        // Error toast is handled by the mutation hook
      }
    },
    [
      selectedOrderId,
      selectedOrder,
      dueDate,
      notes,
      createInvoiceMutation,
      setOpen,
      toast,
    ],
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setSelectedOrderId("");
    setDueDate("");
    setNotes("");
    setOpen(false);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-indigo-400/30 dark:border-indigo-400/30 shadow-[0_30px_80px_rgba(99,102,241,0.45)] dark:shadow-[0_30px_80px_rgba(99,102,241,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white">
            {editingInvoice
              ? `Edit Invoice ${editingInvoice.invoiceNumber}`
              : "Generate Invoice from Order"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {editingInvoice
              ? "Update invoice status, payment information, dates, and notes."
              : "Select an order and set invoice details to generate a new invoice."}
          </DialogDescription>
        </DialogHeader>

        {/* Edit Invoice Form (shown when editing) */}
        {editingInvoice ? (
          <FormProvider {...editFormMethods}>
            <form onSubmit={editFormMethods.handleSubmit(handleUpdateInvoice)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {/* Invoice Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80">
                    Invoice Status
                  </label>
                  <DeferredSelectGate
                    enabled={open}
                    placeholder={
                      <div
                        className="flex h-11 w-full items-center rounded-md border border-indigo-400/30 bg-white/10 px-2 text-sm text-white/60 capitalize"
                        aria-hidden
                      >
                        {editWatch("status") || editingInvoice.status}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={
                          editFormMethods.watch("status") ||
                          editingInvoice.status
                        }
                        onValueChange={(value) =>
                          editFormMethods.setValue(
                            "status",
                            value as InvoiceStatus,
                          )
                        }
                      >
                        <SelectTrigger className={cn("h-11 w-full", DIALOG_FORM_FIELD_INDIGO)}>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent
                          className="border-indigo-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                </div>

                {/* Amount Paid */}
                <FormNumberField
                  name="amountPaid"
                  label="Amount Paid"
                  placeholder="0.00"
                  allowNegative={false}
                  labelClassName="text-white/80"
                  inputClassName={cn("h-11", DIALOG_FORM_FIELD_INDIGO)}
                />

                {/* Order Pricing Summary (read-only — values come from the order) */}
                <div className="sm:col-span-2 p-4 border border-indigo-400/20 rounded-lg bg-white/5 space-y-2">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Subtotal:</span>
                    <span>{fmt(editingInvoice.subtotal ?? 0)}</span>
                  </div>
                  {(editingInvoice.tax ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Tax:</span>
                      <span>{fmt(editingInvoice.tax ?? 0)}</span>
                    </div>
                  )}
                  {(editingInvoice.shipping ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Shipping:</span>
                      <span>{fmt(editingInvoice.shipping ?? 0)}</span>
                    </div>
                  )}
                  {(editingInvoice.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Discount:</span>
                      <span className="text-red-400">
                        -{fmt(editingInvoice.discount ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-medium text-white pt-2 border-t border-indigo-400/20">
                    <span>Total:</span>
                    <span>{fmt(editingInvoice.total ?? 0)}</span>
                  </div>
                </div>

                {/* Due Date */}
                <FormField
                  name="dueDate"
                  label="Due Date"
                  type="date"
                  labelClassName="text-white/80"
                  inputClassName={DIALOG_FORM_FIELD_INDIGO}
                />

                {/* Sent At */}
                {editWatch("status") === "sent" ||
                editWatch("status") === "paid" ||
                editWatch("status") === "overdue" ? (
                  <FormField
                    name="sentAt"
                    label="Sent At"
                    type="date"
                    labelClassName="text-white/80"
                    inputClassName={DIALOG_FORM_FIELD_INDIGO}
                  />
                ) : null}

                {/* Paid At */}
                {editWatch("status") === "paid" ? (
                  <FormField
                    name="paidAt"
                    label="Paid At"
                    type="date"
                    labelClassName="text-white/80"
                    inputClassName={DIALOG_FORM_FIELD_INDIGO}
                  />
                ) : null}

                {/* Cancelled At */}
                {editWatch("status") === "cancelled" ? (
                  <FormField
                    name="cancelledAt"
                    label="Cancelled At"
                    type="date"
                    labelClassName="text-white/80"
                    inputClassName={DIALOG_FORM_FIELD_INDIGO}
                  />
                ) : null}

                {/* Payment Link */}
                <FormField
                  name="paymentLink"
                  label="Payment Link"
                  placeholder="https://..."
                  type="url"
                  labelClassName="text-white/80"
                  className="sm:col-span-2"
                  inputClassName={DIALOG_FORM_FIELD_INDIGO}
                />

                {/* Notes */}
                <div className="sm:col-span-2">
                  <FormField
                    name="notes"
                    label="Notes"
                    placeholder="Enter invoice notes..."
                    labelClassName="text-white/80"
                    inputClassName={DIALOG_FORM_FIELD_INDIGO}
                  />
                </div>
              </div>

              <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="secondary"
                  className={cn("w-full sm:w-auto px-11", GLASS_GHOST_BUTTON)}
                >
                  Cancel
                </Button>
                <DialogSubmitButton
                  isPending={isUpdating}
                  pendingLabel="Updating invoice…"
                  label="Update Invoice"
                  hue="indigo"
                  disabled={isUpdating}
                  className="px-11"
                />
              </DialogFooter>
            </form>
          </FormProvider>
        ) : (
          /* Create Invoice Form (shown when not editing) */
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mt-4">
              {/* Order Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="order-select"
                  className="text-sm font-medium text-white/80"
                >
                  Select Order <span className="text-red-400">*</span>
                </Label>
                {/* REQ-0060: searchable order picker (type-to-filter) replaces plain Select */}
                <OrderPickerCommand
                  orders={availableOrders}
                  selectedOrderId={selectedOrderId}
                  onSelect={setSelectedOrderId}
                  showPlacer={Boolean(isAdminInvoicesPage && isAdmin)}
                  triggerId="order-select"
                  triggerClassName={DIALOG_FORM_FIELD_INDIGO}
                />
                {selectedOrder && (
                  <p className="text-xs text-white/60">
                    Order Total: ${selectedOrder.total.toFixed(2)} | Items:{" "}
                    {selectedOrder.items?.length || 0}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="due-date"
                  className="text-sm font-medium text-white/80 flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Due Date <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={cn("w-full pr-10", DIALOG_FORM_FIELD_INDIGO)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white dark:text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Order Pricing Summary (read-only — values calculated at order time) */}
              {selectedOrder && (
                <div className="p-4 border border-indigo-400/20 rounded-lg bg-white/5 space-y-2">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Subtotal:</span>
                    <span>{fmt(selectedOrder.subtotal ?? 0)}</span>
                  </div>
                  {(selectedOrder.tax ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Tax (7%):</span>
                      <span>{fmt(selectedOrder.tax ?? 0)}</span>
                    </div>
                  )}
                  {(selectedOrder.shipping ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Shipping:</span>
                      <span>{fmt(selectedOrder.shipping ?? 0)}</span>
                    </div>
                  )}
                  {(selectedOrder.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Discount:</span>
                      <span className="text-red-400">
                        -{fmt(selectedOrder.discount ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-medium text-white pt-2 border-t border-indigo-400/20">
                    <span>Invoice Total:</span>
                    <span>{fmt(selectedOrder.total ?? 0)}</span>
                  </div>
                  <p className="text-xs text-white/50 pt-1">
                    Tax, shipping, and discount are calculated from the order
                    and cannot be changed.
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-white/80"
                >
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes for this invoice..."
                  rows={3}
                  className={cn("w-full", DIALOG_FORM_FIELD_INDIGO)}
                />
              </div>
            </div>

            <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                className={cn("w-full sm:w-auto px-11", GLASS_GHOST_BUTTON)}
              >
                Cancel
              </Button>
              <DialogSubmitButton
                isPending={isCreating}
                pendingLabel="Generating invoice…"
                label="Generate Invoice"
                hue="indigo"
                disabled={isCreating || !selectedOrderId || !dueDate}
                className="px-11"
              />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
