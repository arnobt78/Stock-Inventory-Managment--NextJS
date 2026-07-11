/**
 * Invoice Detail Page
 * Displays detailed information about a single invoice
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Calendar,
  MapPin,
  CreditCard,
  DollarSign,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Download,
  ExternalLink,
  Package,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { useInvoice, useDeleteInvoice, useSendInvoice } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import {
  queryKeys,
  invalidateAfterOrderGraphChange,
  isDataSlotLoading,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { markStripeCheckoutReturn } from "@/lib/payments/stripe-return";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDateTime,
  ClientRelativeTime,
  CopyableText,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  ProductLineItemsList,
  GLASS_GHOST_BUTTON,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
} from "@/components/shared";
import { DetailInfoRow } from "@/components/orders/detail/order-detail-primitives";
import type { InvoiceStatus } from "@/types";
import type { Invoice } from "@/types";
import { cn } from "@/lib/utils";
import { APP_SHELL_DETAIL_CLASS } from "@/lib/ui/shell-layout-styles";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import { PaymentDialog } from "@/components/payments";

/**
 * Color variants for glassmorphic cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal";

const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = {
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
    hoverBorder: "hover:border-sky-300/40",
    iconBg: "border-sky-300/30 bg-sky-100/50",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient:
      "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)]",
    hoverBorder: "hover:border-emerald-300/40",
    iconBg: "border-emerald-300/30 bg-emerald-100/50",
  },
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    hoverBorder: "hover:border-amber-300/40",
    iconBg: "border-amber-300/30 bg-amber-100/50",
  },
  rose: {
    border: "border-rose-400/20",
    gradient:
      "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(225,29,72,0.15)] dark:shadow-[0_15px_40px_rgba(225,29,72,0.1)]",
    hoverBorder: "hover:border-rose-300/40",
    iconBg: "border-rose-300/30 bg-rose-100/50",
  },
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
    hoverBorder: "hover:border-violet-300/40",
    iconBg: "border-violet-300/30 bg-violet-100/50",
  },
  blue: {
    border: "border-blue-400/20",
    gradient:
      "bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(59,130,246,0.15)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.1)]",
    hoverBorder: "hover:border-blue-300/40",
    iconBg: "border-blue-300/30 bg-blue-100/50",
  },
  orange: {
    border: "border-orange-400/20",
    gradient:
      "bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(249,115,22,0.15)] dark:shadow-[0_15px_40px_rgba(249,115,22,0.1)]",
    hoverBorder: "hover:border-orange-300/40",
    iconBg: "border-orange-300/30 bg-orange-100/50",
  },
  teal: {
    border: "border-teal-400/20",
    gradient:
      "bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(20,184,166,0.15)] dark:shadow-[0_15px_40px_rgba(20,184,166,0.1)]",
    hoverBorder: "hover:border-teal-300/40",
    iconBg: "border-teal-300/30 bg-teal-100/50",
  },
};

/**
 * Glassmorphic Card component
 */
function GlassCard({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-md transition-all duration-300",
        "bg-white/60 dark:bg-white/5",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

/**
 * Format address for display
 */
function formatAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "N/A";
  const addr = address as Record<string, unknown>;
  const parts: string[] = [];
  if (addr.street) parts.push(String(addr.street));
  if (addr.city) parts.push(String(addr.city));
  if (addr.state) parts.push(String(addr.state));
  if (addr.zipCode) parts.push(String(addr.zipCode));
  if (addr.country) parts.push(String(addr.country));
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

export type InvoiceDetailPageProps = {
  /** When set (e.g. "/admin/client-invoices"), Back button navigates here */
  backHref?: string;
  /** When true, do not wrap in Navbar (e.g. when embedded in admin layout) */
  embedInAdmin?: boolean;
  initialInvoice?: Invoice;
};

export default function InvoiceDetailPage({
  backHref,
  embedInAdmin,
  initialInvoice,
}: InvoiceDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isCheckingAuth } = useAuth();
  const invoicesListPath = useMemo(() => {
    if (user?.role === "admin" || user?.role === "user")
      return "/admin/invoices";
    return "/invoices";
  }, [user?.role]);
  const { handleBack, navigateTo } = useBackWithRefresh("invoice", {
    fallbackPath: invoicesListPath,
  });
  const invoiceId = params?.id as string;
  const onBack = backHref
    ? () => {
        invalidateAfterOrderGraphChange(queryClient);
        navigateTo(backHref);
      }
    : handleBack;
  const Wrapper = embedInAdmin ? React.Fragment : Navbar;
  /** REQ-0063 — admin invoice detail links to /admin/orders (matches InvoiceActions) */
  const linkedOrderHrefBase = embedInAdmin ? "/admin/orders" : "/orders";

  // Fetch invoice details — shell-first: layout always visible; pulse dynamic slots only (REQ-0022)
  const invoiceQuery = useInvoice(invoiceId, initialInvoice);
  const invoice = invoiceQuery.data;
  const dataLoading = isDataSlotLoading(invoiceQuery, initialInvoice);
  const { isError, error } = invoiceQuery;

  useSyncSsrQueryData(queryKeys.invoices.detail(invoiceId), initialInvoice);

  // When returning from Stripe (payment=success or payment=cancelled), refetch invoice so UI shows Paid without manual refresh.
  // The webhook updates invoice asynchronously, so we poll a few times to catch the update.
  // NOTE: searchParams omitted from deps - router.replace clears it, which would re-run effect and cancel polling.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (
      !invoiceId ||
      !payment ||
      (payment !== "success" && payment !== "cancelled")
    )
      return;

    markStripeCheckoutReturn();

    const detailKey = queryKeys.invoices.detail(invoiceId);
    invalidateAfterOrderGraphChange(queryClient);
    queryClient.refetchQueries({ queryKey: detailKey });

    // Poll: webhook may not have run yet
    const runInvalidations = () => {
      invalidateAfterOrderGraphChange(queryClient);
      queryClient.refetchQueries({ queryKey: detailKey });
    };
    const delays = [500, 1500, 3000, 5000, 8000];
    const timeouts = delays.map((delay) => setTimeout(runInvalidations, delay));

    const cleanupUrlTimer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("payment");
      next.delete("session_id");
      const path =
        window.location.pathname +
        (next.toString() ? `?${next.toString()}` : "");
      window.location.replace(path);
    }, 1500);

    return () => {
      clearTimeout(cleanupUrlTimer);
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [invoiceId, queryClient, router]);
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const isDeleting = deleteInvoiceMutation.isPending;
  const isSending = sendInvoiceMutation.isPending;
  const isClientRole = user?.role === "client";

  // Edit Invoice: open InvoiceDialog in edit mode (same as InvoiceList/InvoiceActions)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const handleEditInvoice = useCallback(() => {
    if (!invoice) return;
    setEditingInvoice(invoice);
    setEditDialogOpen(true);
  }, [invoice]);

  const handleConfirmDeleteInvoice = useCallback(() => {
    if (!invoice) return;
    // navigateTo invalidates TanStack invoice caches before navigating to the list
    deleteInvoiceMutation.mutate(invoice.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        navigateTo("/invoices");
      },
      onError: () => {
        setDeleteDialogOpen(false);
      },
    });
  }, [invoice, deleteInvoiceMutation, navigateTo]);

  const handleConfirmSendInvoice = useCallback(() => {
    if (!invoice) return;
    sendInvoiceMutation.mutate(invoice.id, {
      onSuccess: () => {
        setSendDialogOpen(false);
      },
      onError: () => {
        setSendDialogOpen(false);
      },
    });
  }, [invoice, sendInvoiceMutation]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push("/login");
    }
  }, [user, isCheckingAuth, router]);

  // Show error state
  if (isError) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error instanceof Error
                ? error.message
                : "Failed to load invoice details"}
            </p>
            <Button
              onClick={() => navigateTo("/")}
              className="rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </GlassCard>
        </div>
      </Wrapper>
    );
  }

  // Loaded but missing entity (not a query error)
  if (!dataLoading && !invoice) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The invoice you are looking for does not exist or was removed.
            </p>
            <Button
              onClick={() => navigateTo("/")}
              className="rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-700 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </GlassCard>
        </div>
      </Wrapper>
    );
  }

  const actionsDisabled = dataLoading || !invoice || isClientRole;

  // Format dates — shell visible while loading; pulse individual slots (REQ-0022)
  const createdAt = invoice?.createdAt
    ? new Date(invoice.createdAt)
    : new Date();
  const updatedAt = invoice?.updatedAt ? new Date(invoice.updatedAt) : null;
  const issuedAt = invoice?.issuedAt ? new Date(invoice.issuedAt) : new Date();
  const dueDate = invoice?.dueDate ? new Date(invoice.dueDate) : new Date();
  const sentAt = invoice?.sentAt ? new Date(invoice.sentAt) : null;
  const paidAt = invoice?.paidAt ? new Date(invoice.paidAt) : null;
  const cancelledAt = invoice?.cancelledAt
    ? new Date(invoice.cancelledAt)
    : null;

  // Check if invoice is overdue (only when loaded)
  const isOverdue =
    !dataLoading &&
    invoice != null &&
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    dueDate < new Date();

  return (
    <Wrapper>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <PageSectionHeader
            as="h1"
            tone="emerald"
            icon={FileText}
            leading={
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className={DETAIL_HEADER_BACK_ICON_CLASS}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            }
            title={
              <>
                Invoice{" "}
                {dataLoading ? (
                  <DataSlotPulse
                    variant="text-lg"
                    className="inline-block w-32 align-middle"
                  />
                ) : (
                  // Copy icon next to the invoice number in the detail page title
                  <CopyableText
                    value={invoice!.invoiceNumber}
                    className="align-middle"
                  >
                    {invoice!.invoiceNumber}
                  </CopyableText>
                )}
              </>
            }
            description={
              dataLoading ? (
                <DataSlotPulse variant="date" />
              ) : (
                <ClientRelativeTime date={createdAt} prefix="Created " />
              )
            }
          />

          {/* Invoice Status Cards — shared semantic badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <GlassCard variant="violet">
              <div className="">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-3">
                  Invoice Status
                </p>
                {dataLoading ? (
                  <DataSlotPulse
                    variant="badge"
                    className="h-7 w-20 rounded-full"
                  />
                ) : (
                  <InvoiceStatusBadge
                    status={invoice!.status}
                    className="text-sm"
                  />
                )}
              </div>
            </GlassCard>

            <GlassCard
              variant={
                !dataLoading && invoice!.amountDue > 0 && isOverdue
                  ? "rose"
                  : !dataLoading && invoice!.amountDue > 0
                    ? "amber"
                    : "emerald"
              }
            >
              <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
                Amount Due
              </p>
              {dataLoading ? (
                <DataSlotPulse variant="currency" className="h-8 w-28" />
              ) : (
                <>
                  <div
                    className={cn(
                      "text-sm sm:text-lg font-medium",
                      invoice!.amountDue > 0 && !isOverdue
                        ? "text-amber-600 dark:text-amber-400"
                        : invoice!.amountDue > 0 && isOverdue
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    ${invoice!.amountDue.toFixed(2)}
                  </div>
                  {invoice!.amountPaid > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Paid: ${invoice!.amountPaid.toFixed(2)} / $
                      {invoice!.total.toFixed(2)}
                    </p>
                  )}
                </>
              )}
            </GlassCard>
          </div>

          {/* Invoice Information */}
          <GlassCard variant="orange">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.orange.iconBg,
                  "dark:border-orange-400/30 dark:bg-orange-500/20",
                )}
              >
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Invoice Information
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {dataLoading ? (
                    <DataSlotPulse variant="text-sm" className="w-40" />
                  ) : (
                    <CopyableText value={invoice!.invoiceNumber}>
                      Invoice #{invoice!.invoiceNumber} -{" "}
                      {invoice!.status.charAt(0).toUpperCase() +
                        invoice!.status.slice(1)}
                    </CopyableText>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {!dataLoading && invoice && (
                <DetailInfoRow icon={Hash} label="Invoice ID:" tone="violet">
                  <span className="font-mono text-xs">{invoice.id}</span>
                </DetailInfoRow>
              )}
              <DetailInfoRow icon={DollarSign} label="Amount Paid:" tone="emerald" loading={dataLoading}>
                {!dataLoading && invoice && `$${invoice.amountPaid.toFixed(2)}`}
              </DetailInfoRow>
              <DetailInfoRow icon={DollarSign} label="Amount Due:" tone={!dataLoading && isOverdue ? "rose" : "amber"} loading={dataLoading}>
                {!dataLoading && invoice && (
                  <>
                    ${invoice.amountDue.toFixed(2)}
                    {isOverdue ? " (Overdue)" : ""}
                  </>
                )}
              </DetailInfoRow>
              <DetailInfoRow icon={Calendar} label="Issued:" tone="orange" loading={dataLoading}>
                {!dataLoading && <ClientDateTime date={issuedAt} />}
              </DetailInfoRow>
              <DetailInfoRow
                icon={Calendar}
                label="Due Date:"
                tone={!dataLoading && isOverdue ? "rose" : "amber"}
                loading={dataLoading}
              >
                {!dataLoading && <ClientDateTime date={dueDate} />}
              </DetailInfoRow>
              <DetailInfoRow icon={Send} label="Sent:" tone="blue" loading={dataLoading}>
                {!dataLoading && (sentAt ? <ClientDateTime date={sentAt} /> : "—")}
              </DetailInfoRow>
              <DetailInfoRow icon={CheckCircle} label="Paid:" tone="emerald" loading={dataLoading}>
                {!dataLoading &&
                  (paidAt ? (
                    <ClientDateTime date={paidAt} />
                  ) : (
                    "—"
                  ))}
              </DetailInfoRow>
              <DetailInfoRow icon={XCircle} label="Cancelled:" tone="rose" loading={dataLoading}>
                {!dataLoading &&
                  (cancelledAt ? (
                    <ClientDateTime date={cancelledAt} />
                  ) : (
                    "—"
                  ))}
              </DetailInfoRow>
              {(dataLoading || updatedAt) && (
                <DetailInfoRow icon={Calendar} label="Updated:" tone="sky" loading={dataLoading}>
                  {!dataLoading && updatedAt && <ClientDateTime date={updatedAt} />}
                </DetailInfoRow>
              )}
              {!dataLoading && invoice?.orderId && (
                <DetailInfoRow icon={FileText} label="Related Order:" tone="violet">
                  {invoice.linkedOrderNumber ? (
                    <CopyableText value={invoice.linkedOrderNumber} className="font-medium">
                      <Link
                        href={`${linkedOrderHrefBase}/${invoice.orderId}`}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1"
                      >
                        {invoice.linkedOrderNumber}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </CopyableText>
                  ) : (
                    <Link
                      href={`${linkedOrderHrefBase}/${invoice.orderId}`}
                      className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1"
                    >
                      View Order <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </DetailInfoRow>
              )}
              {!dataLoading && invoice && (
                <DetailInfoRow icon={CreditCard} label="Payment Link:" tone="sky">
                  {invoice.paymentLink ? (
                    <a
                      href={invoice.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1"
                    >
                      Pay Invoice <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailInfoRow>
              )}
              {!dataLoading && invoice?.stripePaymentIntentId && (
                <DetailInfoRow icon={CreditCard} label="Stripe:" tone="blue">
                  <span className="font-mono text-xs break-all">
                    {invoice.stripePaymentIntentId}
                  </span>
                </DetailInfoRow>
              )}
              {!dataLoading && invoice?.notes && (
                <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Notes:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-white">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* REQ-0063 — linked order line items with product thumbnails (SSR via linkedOrderItems) */}
          {(dataLoading ||
            (invoice?.linkedOrderItems && invoice.linkedOrderItems.length > 0)) && (
            <GlassCard variant="sky">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.sky.iconBg,
                    "dark:border-sky-400/30 dark:bg-sky-500/20",
                  )}
                >
                  <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    Order Items
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {dataLoading ? (
                      <DataSlotPulse variant="text-sm" className="w-28" />
                    ) : (
                      <>
                        {invoice!.linkedOrderItems!.length} item
                        {invoice!.linkedOrderItems!.length !== 1 ? "s" : ""} on
                        this invoice
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {dataLoading ? (
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-sky-200/40 dark:border-sky-400/20 bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent"
                    >
                      <div className="flex-1 space-y-2">
                        <DataSlotPulse variant="text-md" className="w-40" />
                        <DataSlotPulse variant="text-sm" className="w-24" />
                      </div>
                      <DataSlotPulse variant="currency" />
                    </div>
                  ))
                ) : (
                  <ProductLineItemsList
                    items={invoice!.linkedOrderItems ?? []}
                    linkMode={embedInAdmin ? "admin" : "none"}
                    emptyMessage="No items on linked order"
                  />
                )}
              </div>
            </GlassCard>
          )}

          {/* Parties & roles — shell visible while loading (REQ-0022) */}
          {(dataLoading ||
            invoice?.invoiceCreatedBy != null ||
            invoice?.orderedBy != null ||
            invoice?.client != null ||
            (invoice?.invoiceProductOwners &&
              invoice.invoiceProductOwners.length > 0)) && (
            <GlassCard variant="teal">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.teal.iconBg,
                    "dark:border-teal-400/30 dark:bg-teal-500/20",
                  )}
                >
                  <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Parties &amp; roles
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {(dataLoading || invoice?.invoiceCreatedBy) && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                      Invoice created by
                    </p>
                    {dataLoading ? (
                      <DataSlotPulse variant="text-md" className="w-36" />
                    ) : (
                      <>
                        <p className="text-gray-700 dark:text-white">
                          {invoice!.invoiceCreatedBy!.name ??
                            invoice!.invoiceCreatedBy!.email}
                        </p>
                        {invoice!.invoiceCreatedBy!.name && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {invoice!.invoiceCreatedBy!.email}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                {(dataLoading || invoice?.orderedBy) && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                      Ordered by
                    </p>
                    {dataLoading ? (
                      <DataSlotPulse variant="text-md" className="w-36" />
                    ) : (
                      <>
                        <p className="text-gray-700 dark:text-white">
                          {invoice!.orderedBy!.name ??
                            invoice!.orderedBy!.email}
                        </p>
                        {invoice!.orderedBy!.name && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {invoice!.orderedBy!.email}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                {(dataLoading || invoice?.client) && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5">
                      Customer / Bill to
                    </p>
                    {dataLoading ? (
                      <DataSlotPulse variant="text-md" className="w-36" />
                    ) : (
                      <>
                        <p className="text-gray-700 dark:text-white">
                          {invoice!.client!.name ?? invoice!.client!.email}
                        </p>
                        {invoice!.client!.name && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {invoice!.client!.email}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                {!dataLoading &&
                  invoice!.invoiceProductOwners &&
                  invoice!.invoiceProductOwners.length > 0 && (
                    <div className="sm:col-span-2 p-2 rounded-xl bg-gradient-to-r from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border border-teal-200/30 dark:border-teal-400/10">
                      <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                        Product owner(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {invoice!.invoiceProductOwners.map((owner) => (
                          <span
                            key={owner.userId}
                            className="inline-flex items-center gap-1 rounded-md bg-white/50 dark:bg-white/10 px-2 py-1 text-xs border border-teal-200/30 dark:border-teal-400/20"
                          >
                            {owner.name ?? owner.email}
                            {owner.name && (
                              <span className="text-gray-500 dark:text-gray-400">
                                ({owner.email})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </GlassCard>
          )}

          {/* Billing Address & Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
            {/* Billing Address — shell visible while loading */}
            {(dataLoading || invoice?.billingAddress) && (
              <GlassCard variant="sky">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl border",
                      variantConfig.sky.iconBg,
                      "dark:border-sky-400/30 dark:bg-sky-500/20",
                    )}
                  >
                    <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    Billing Address
                  </h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent border border-sky-200/30 dark:border-sky-400/10">
                  {dataLoading ? (
                    <DataSlotPulse variant="text-md" className="w-full" />
                  ) : (
                    formatAddress(invoice!.billingAddress)
                  )}
                </p>
              </GlassCard>
            )}

            {/* Invoice Totals */}
            <GlassCard variant="teal">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    variantConfig.teal.iconBg,
                    "dark:border-teal-400/30 dark:bg-teal-500/20",
                  )}
                >
                  <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Invoice Summary
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-sky-100/40 via-sky-50/20 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="font-medium text-gray-700 dark:text-white">
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${invoice!.subtotal.toFixed(2)}`
                    )}
                  </span>
                </div>
                {!dataLoading && invoice!.tax && invoice!.tax > 0 && (
                  <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-amber-100/40 via-amber-50/20 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tax:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-white">
                      ${invoice!.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                {!dataLoading &&
                  invoice!.shipping != null &&
                  invoice!.shipping > 0 && (
                    <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent">
                      <span className="text-gray-600 dark:text-gray-400">
                        Shipping:
                      </span>
                      <span className="font-medium text-gray-700 dark:text-white">
                        ${invoice!.shipping.toFixed(2)}
                      </span>
                    </div>
                  )}
                {!dataLoading && invoice!.discount && invoice!.discount > 0 && (
                  <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-rose-100/40 via-rose-50/20 to-transparent dark:from-rose-500/10 dark:via-rose-500/5 dark:to-transparent">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount:
                    </span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      -${invoice!.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
                <div className="flex justify-between text-sm sm:text-lg font-medium p-2 rounded-xl bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/15 dark:via-blue-500/10 dark:to-transparent border border-blue-200/30 dark:border-blue-400/20">
                  <span className="text-gray-700 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${invoice!.total.toFixed(2)}`
                    )}
                  </span>
                </div>
                {!dataLoading && invoice!.amountPaid > 0 && (
                  <>
                    <Separator className="my-2 bg-teal-200/50 dark:bg-teal-400/20" />
                    <div className="flex justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-emerald-100/40 via-emerald-50/20 to-transparent dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-transparent">
                      <span className="text-gray-600 dark:text-gray-400">
                        Amount Paid:
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        ${invoice!.amountPaid.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex justify-between text-sm sm:text-lg font-medium p-2 rounded-xl border",
                        invoice!.amountDue > 0 && isOverdue
                          ? "bg-gradient-to-r from-rose-100/50 via-rose-50/30 to-transparent dark:from-rose-500/15 dark:via-rose-500/10 dark:to-transparent border-rose-200/30 dark:border-rose-400/20"
                          : invoice!.amountDue > 0
                            ? "bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-transparent dark:from-amber-500/15 dark:via-amber-500/10 dark:to-transparent border-amber-200/30 dark:border-amber-400/20"
                            : "bg-gradient-to-r from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/10 dark:to-transparent border-emerald-200/30 dark:border-emerald-400/20",
                      )}
                    >
                      <span className="text-gray-700 dark:text-white">
                        Amount Due:
                      </span>
                      <span
                        className={cn(
                          invoice!.amountDue > 0 && isOverdue
                            ? "text-rose-600 dark:text-rose-400"
                            : invoice!.amountDue > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        ${invoice!.amountDue.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Actions — Back, Edit Invoice, Send Invoice, Delete Invoice; same layout as order detail */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={onBack}
              className={cn("w-full sm:w-auto gap-2", GLASS_GHOST_BUTTON)}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleEditInvoice}
              disabled={actionsDisabled}
              className={glassDetailFooterButtonClass("blue")}
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Invoice
            </Button>
            {!dataLoading && invoice && (
              <Button
                asChild
                className={glassDetailFooterButtonClass("teal")}
              >
                <a
                  href={`/api/invoices/${invoice.id}/pdf`}
                  download={`invoice-${invoice.invoiceNumber}.pdf`}
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Download PDF
                </a>
              </Button>
            )}
            {!dataLoading && invoice && invoice.status === "draft" && (
              <DialogSubmitButton
                type="button"
                onClick={() => setSendDialogOpen(true)}
                isPending={isSending}
                pendingLabel="Sending…"
                label="Send Invoice"
                hue="sky"
                className="group w-full sm:w-auto gap-2"
              />
            )}
            {!dataLoading && invoice && invoice.status !== "cancelled" && (
              <DialogSubmitButton
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                isPending={isDeleting}
                pendingLabel="Deleting…"
                label="Delete Invoice"
                hue="rose"
                className="group w-full sm:w-auto gap-2"
              />
            )}
            {!dataLoading && invoice?.orderId && (
              <Button
                asChild
                className={glassDetailFooterButtonClass("violet")}
              >
                <Link href={`${linkedOrderHrefBase}/${invoice.orderId}`}>
                  <FileText className="h-4 w-4 shrink-0" />
                  View Related Order
                </Link>
              </Button>
            )}
            {!dataLoading &&
              invoice &&
              invoice.status !== "paid" &&
              invoice.status !== "cancelled" &&
              invoice.amountDue > 0 && (
                <PaymentDialog
                  type="invoice"
                  id={invoice.id}
                  referenceNumber={invoice.invoiceNumber}
                  amount={invoice.amountDue}
                  tax={invoice.tax ?? undefined}
                  shipping={invoice.shipping ?? undefined}
                  discount={invoice.discount ?? undefined}
                  trigger={
                    <Button className={glassDetailFooterButtonClass("emerald")}>
                      <CreditCard className="h-4 w-4 shrink-0" />
                      Pay ${invoice.amountDue.toFixed(2)}
                    </Button>
                  }
                />
              )}
          </div>

          {/* Delete Invoice confirmation — same pattern as InvoiceActions */}
          {invoice && (
            <AlertDialogWrapper
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title="Delete Invoice"
              description={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
              actionLabel="Delete"
              actionLoadingLabel="Deleting..."
              isLoading={isDeleting}
              onAction={handleConfirmDeleteInvoice}
              onCancel={() => setDeleteDialogOpen(false)}
            />
          )}

          {/* Send Invoice confirmation — same pattern as InvoiceActions */}
          {invoice && (
            <AlertDialogWrapper
              open={sendDialogOpen}
              onOpenChange={setSendDialogOpen}
              title="Send Invoice"
              description={`Are you sure you want to send invoice ${invoice.invoiceNumber} via email?`}
              actionLabel="Send"
              actionLoadingLabel="Sending..."
              isLoading={isSending}
              onAction={handleConfirmSendInvoice}
              onCancel={() => setSendDialogOpen(false)}
              actionVariant="default"
            />
          )}

          {/* Edit Invoice dialog — opened by "Edit Invoice"; controlled as in InvoiceList */}
          <InvoiceDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setEditingInvoice(null);
              }
            }}
            editingInvoice={editingInvoice}
            onEditInvoice={(inv) => {
              setEditingInvoice(inv ?? null);
            }}
          />
        </div>
      </PageContentWrapper>
    </Wrapper>
  );
}
