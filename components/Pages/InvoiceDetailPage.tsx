/**
 * Invoice Detail Page
 * REQ-0162 — layout + info density parity with Order Detail (status|billing, items|summary, info|parties).
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Calendar,
  MapPin,
  CreditCard,
  Send,
  Edit,
  Download,
  ExternalLink,
  Hash,
  Trash2,
  StickyNote,
  Wallet,
  Banknote,
  CheckCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
import { useInvoice, useDeleteInvoice, useSendInvoice } from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useStripeCheckoutReturn } from "@/hooks/use-stripe-checkout-return";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";
import {
  queryKeys,
  isDataSlotLoading,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { useAuth } from "@/contexts";
import { toDateOrNull } from "@/lib/format";
import Navbar from "@/components/layouts/Navbar";
import {
  ClientDateTime,
  ClientRelativeTime,
  CopyableText,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  AuditUserDetailRow,
  DetailInfoRowGroup,
  SectionCardHeader,
  GlassCard,
} from "@/components/shared";
import { InvoiceSummaryCard } from "@/components/invoices/detail/InvoiceSummaryCard";
import { InvoiceItemsCard } from "@/components/invoices/detail/InvoiceItemsCard";
import { InvoicePartiesCard } from "@/components/invoices/detail/InvoicePartiesCard";
import {
  DetailInfoRow,
  formatAddress,
} from "@/components/orders/detail/order-detail-primitives";
import type { Invoice } from "@/types";
import type { OrderReviewContext } from "@/lib/server/order-review-context-data";
import { cn } from "@/lib/utils";
import {
  APP_SHELL_DETAIL_CLASS,
  DETAIL_PAGE_HEADER_SPACING_CLASS,
} from "@/lib/ui/shell-layout-styles";
import { TYPO_CARD_TITLE } from "@/lib/ui/typography-scale";
import { dueDateSemanticKind } from "@/lib/ui/semantic-date-styles";
import InvoiceDialog from "@/components/invoices/InvoiceDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import { PaymentDialog } from "@/components/payments";

export type InvoiceDetailPageProps = {
  /** When set (e.g. "/admin/client-invoices"), Back button navigates here */
  backHref?: string;
  /** When true, do not wrap in Navbar (e.g. when embedded in admin layout) */
  embedInAdmin?: boolean;
  initialInvoice?: Invoice;
  /** REQ-0163 — SSR reviews/eligibility for Order Items Write review (hydrate-safe) */
  initialReviewContext?: OrderReviewContext;
};

export default function InvoiceDetailPage({
  backHref,
  embedInAdmin,
  initialInvoice,
  initialReviewContext,
}: InvoiceDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { user, isCheckingAuth } = useAuth();
  // REQ-0209 — list path follows route shell (/invoices vs /admin/invoices)
  const invoicesListPath = useMemo(
    () => (pathname.startsWith("/admin") ? "/admin/invoices" : "/invoices"),
    [pathname],
  );
  const { handleBack, navigateTo } = useBackWithRefresh("invoice", {
    fallbackPath: invoicesListPath,
  });
  const invoiceId = params?.id as string;
  const onBack = backHref ? () => navigateTo(backHref) : handleBack;
  const Wrapper = embedInAdmin ? React.Fragment : Navbar;
  /** REQ-0063 — admin invoice detail links to /admin/orders (matches InvoiceActions) */
  const linkedOrderHrefBase = embedInAdmin ? "/admin/orders" : "/orders";

  // Fetch invoice details — shell-first: layout always visible; pulse dynamic slots only (REQ-0022)
  const invoiceQuery = useInvoice(invoiceId, initialInvoice);
  const invoice = invoiceQuery.data;
  const dataLoading = isDataSlotLoading(invoiceQuery, initialInvoice);
  const { isError, error } = invoiceQuery;

  useSyncSsrQueryData(queryKeys.invoices.detail(invoiceId), initialInvoice);
  useStripeCheckoutReturn({ entityId: invoiceId, entity: "invoice" });

  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const isDeleting = deleteInvoiceMutation.isPending;
  const isSending = sendInvoiceMutation.isPending;
  const isClientRole = user?.role === "client";
  const isSupplierRole = user?.role === "supplier";
  const isAdminRole = user?.role === "admin" || Boolean(embedInAdmin);
  const disableInvoiceMutations = isClientRole || isSupplierRole;

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
          <GlassCard
            padding="body"
            variant="rose"
            className="max-w-md text-center"
          >
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
          <GlassCard
            padding="body"
            variant="rose"
            className="max-w-md text-center"
          >
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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

  const actionsDisabled = dataLoading || !invoice || disableInvoiceMutations;

  // Format dates — shell visible while loading; pulse individual slots (REQ-0022)
  // REQ-0136 — never fall back to `new Date()` ("now"): SSR/client render at different
  // instants and that non-determinism is a classic hydration-mismatch source.
  const createdAt = toDateOrNull(invoice?.createdAt);
  const updatedAt = invoice?.updatedAt ? new Date(invoice.updatedAt) : null;
  const issuedAt = invoice?.issuedAt ? new Date(invoice.issuedAt) : null;
  const dueDate = invoice?.dueDate ? new Date(invoice.dueDate) : null;
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
    dueDate != null &&
    dueDate < new Date();

  const isInvoiceCancelled = invoice?.status === "cancelled";
  const isOrderRefunded =
    invoice?.linkedOrderPaymentStatus === "refunded" ||
    invoice?.linkedOrderStatus === "cancelled";
  const amountDueToneClass =
    !dataLoading && invoice
      ? isInvoiceCancelled
        ? "text-rose-600 dark:text-rose-400"
        : invoice.amountDue > 0 && isOverdue
          ? "text-rose-600 dark:text-rose-400"
          : invoice.amountDue > 0
            ? "text-amber-600 dark:text-amber-400"
            : "text-emerald-600 dark:text-emerald-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <Wrapper>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
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
              ) : !createdAt ? (
                <span className="text-gray-500 dark:text-white/60">—</span>
              ) : (
                <ClientRelativeTime
                  date={createdAt}
                  prefix="Created "
                  semantic="created"
                />
              )
            }
          />

          {/* REQ-0162 — status stack | billing (Order Detail parity) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
            <div className="flex flex-col gap-2 min-w-0 h-full">
              <GlassCard padding="body" variant="violet">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/80 mb-3">
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
              </GlassCard>

              <GlassCard
                padding="body"
                variant={
                  !dataLoading && isInvoiceCancelled
                    ? "rose"
                    : !dataLoading && invoice!.amountDue > 0 && isOverdue
                      ? "rose"
                      : !dataLoading && invoice!.amountDue > 0
                        ? "amber"
                        : "emerald"
                }
                className="flex-1"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/80 mb-3">
                  {isInvoiceCancelled ? "Balance Closed" : "Amount Due"}
                </p>
                {dataLoading ? (
                  <DataSlotPulse variant="currency" className="h-8 w-28" />
                ) : (
                  <>
                    <div
                      className={cn(
                        "text-sm sm:text-lg font-normal",
                        amountDueToneClass,
                      )}
                    >
                      ${invoice!.amountDue.toFixed(2)}
                    </div>
                    {/* REQ-0210 — cancelled/refunded: show collected history, not "Paid in full" */}
                    {invoice!.amountPaid > 0 && (
                      <p className="text-sm mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-gray-600 dark:text-gray-300">
                        <span>
                          {isInvoiceCancelled || isOrderRefunded
                            ? "Collected:"
                            : "Paid:"}
                        </span>
                        <span
                          className={cn(
                            "font-normal",
                            isInvoiceCancelled || isOrderRefunded
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          ${invoice!.amountPaid.toFixed(2)}
                        </span>
                        <span>/</span>
                        <span className="font-normal text-gray-600 dark:text-gray-300">
                          ${invoice!.total.toFixed(2)}
                        </span>
                        {(isInvoiceCancelled || isOrderRefunded) && (
                          <span className="w-full text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                            {isOrderRefunded
                              ? "Refunded — no remaining balance"
                              : "Cancelled — no remaining balance"}
                          </span>
                        )}
                      </p>
                    )}
                  </>
                )}
              </GlassCard>
            </div>

            {/* REQ-0210 — billing + shipping stacked (order addresses when invoice billing empty) */}
            {(dataLoading ||
              invoice?.billingAddress ||
              invoice?.shippingAddress) && (
              <div className="flex flex-col gap-2">
                {(dataLoading || invoice?.billingAddress) && (
                  <GlassCard padding="body" variant="blue" className="h-full">
                    <SectionCardHeader
                      title="Billing Address"
                      icon={MapPin}
                      tone="blue"
                      className="mb-3"
                      titleClassName={cn(
                        TYPO_CARD_TITLE,
                        "text-gray-700 dark:text-white",
                      )}
                    />
                    <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-blue-100/40 via-blue-50/20 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border border-blue-200/30 dark:border-blue-400/10">
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-full" />
                      ) : (
                        formatAddress(invoice!.billingAddress)
                      )}
                    </p>
                  </GlassCard>
                )}
                {(dataLoading || invoice?.shippingAddress) && (
                  <GlassCard padding="body" variant="violet" className="h-full">
                    <SectionCardHeader
                      title="Shipping Address"
                      icon={MapPin}
                      tone="violet"
                      className="mb-3"
                      titleClassName={cn(
                        TYPO_CARD_TITLE,
                        "text-gray-700 dark:text-white",
                      )}
                    />
                    <p className="text-sm text-gray-700 dark:text-white p-2 rounded-xl bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10">
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-full" />
                      ) : (
                        formatAddress(invoice!.shippingAddress)
                      )}
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </div>

          {/* REQ-0162 — Order Items | Invoice Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
            <InvoiceItemsCard
              invoice={invoice}
              dataLoading={dataLoading}
              // REQ-0163 — store owner + client/supplier get portal product sky links
              linkMode={
                embedInAdmin || user?.role === "admin"
                  ? "admin"
                  : isClientRole ||
                      user?.role === "supplier" ||
                      user?.role === "user"
                    ? "portal"
                    : "none"
              }
              warehouseLinkMode={
                user?.role === "admin"
                  ? "admin"
                  : user?.role === "user"
                    ? "owner"
                    : "none"
              }
              initialReviewContext={initialReviewContext}
            />
            <InvoiceSummaryCard invoice={invoice} dataLoading={dataLoading} />
          </div>

          {/* REQ-0162 — Invoice Information | Parties */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-start">
            <GlassCard padding="body" variant="orange">
              <SectionCardHeader
                title="Invoice Information"
                icon={FileText}
                tone="orange"
                className="mb-4"
                titleClassName={cn(
                  TYPO_CARD_TITLE,
                  "text-gray-700 dark:text-white",
                )}
              />

              <div className="space-y-2">
                {!dataLoading && invoice && (
                  <>
                    <DetailInfoRow
                      icon={FileText}
                      label="Invoice #:"
                      tone="orange"
                    >
                      <CopyableText value={invoice.invoiceNumber}>
                        {invoice.invoiceNumber}
                      </CopyableText>
                    </DetailInfoRow>
                    <DetailInfoRow icon={Hash} label="Invoice ID:" tone="violet">
                      <CopyableText value={invoice.id}>
                        <span className="font-mono text-xs">{invoice.id}</span>
                      </CopyableText>
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={FileText}
                      label="Invoice Status:"
                      tone="violet"
                    >
                      <InvoiceStatusBadge status={invoice.status} />
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={Wallet}
                      label="Amount Paid:"
                      tone="emerald"
                    >
                      <span className="text-emerald-600 dark:text-emerald-400 font-normal">
                        ${Number(invoice.amountPaid).toFixed(2)}
                      </span>
                    </DetailInfoRow>
                    <DetailInfoRow
                      icon={Banknote}
                      label="Amount Due:"
                      tone={
                        invoice.amountDue > 0 && isOverdue
                          ? "rose"
                          : invoice.amountDue > 0
                            ? "amber"
                            : "emerald"
                      }
                    >
                      <span className={cn("font-normal", amountDueToneClass)}>
                        ${Number(invoice.amountDue).toFixed(2)}
                      </span>
                    </DetailInfoRow>
                  </>
                )}

                <DetailInfoRowGroup>
                  {(dataLoading || issuedAt) && (
                    <DetailInfoRow
                      icon={Calendar}
                      label="Issued:"
                      tone="orange"
                      loading={dataLoading}
                    >
                      {!dataLoading && issuedAt && (
                        <ClientDateTime date={issuedAt} semantic="created" />
                      )}
                    </DetailInfoRow>
                  )}
                  {(dataLoading || updatedAt) && (
                    <DetailInfoRow
                      icon={Calendar}
                      label="Updated:"
                      tone="amber"
                      loading={dataLoading}
                    >
                      {!dataLoading && updatedAt && (
                        <ClientDateTime date={updatedAt} semantic="updated" />
                      )}
                    </DetailInfoRow>
                  )}
                </DetailInfoRowGroup>

                {!dataLoading && dueDate && (
                  <DetailInfoRow
                    icon={Calendar}
                    label="Due Date:"
                    tone={isOverdue ? "rose" : "amber"}
                  >
                    <ClientDateTime
                      date={dueDate}
                      semantic={dueDateSemanticKind(Boolean(isOverdue))}
                    />
                  </DetailInfoRow>
                )}
                {!dataLoading && sentAt && (
                  <DetailInfoRow icon={Send} label="Sent:" tone="violet">
                    <ClientDateTime date={sentAt} semantic="sent" />
                  </DetailInfoRow>
                )}
                {!dataLoading && paidAt && (
                  <DetailInfoRow
                    icon={CheckCircle}
                    label="Paid:"
                    tone="emerald"
                  >
                    <ClientDateTime date={paidAt} semantic="paid" />
                  </DetailInfoRow>
                )}
                {!dataLoading && cancelledAt && (
                  <DetailInfoRow icon={Ban} label="Cancelled:" tone="rose">
                    <ClientDateTime date={cancelledAt} semantic="cancelled" />
                  </DetailInfoRow>
                )}

                {!dataLoading && invoice?.orderId && (
                  <DetailInfoRow
                    icon={FileText}
                    label="Related Order:"
                    tone="violet"
                  >
                    {invoice.linkedOrderNumber ? (
                      <CopyableText value={invoice.linkedOrderNumber}>
                        <Link
                          href={`${linkedOrderHrefBase}/${invoice.orderId}`}
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal"
                        >
                          {invoice.linkedOrderNumber}
                        </Link>
                      </CopyableText>
                    ) : (
                      <Link
                        href={`${linkedOrderHrefBase}/${invoice.orderId}`}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-normal"
                      >
                        View Order
                      </Link>
                    )}
                  </DetailInfoRow>
                )}

                {!dataLoading && invoice?.paymentLink && (
                  <DetailInfoRow
                    icon={CreditCard}
                    label="Payment Link:"
                    tone="sky"
                  >
                    <a
                      href={invoice.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1 font-normal"
                    >
                      Pay Invoice <ExternalLink className="h-3 w-3" />
                    </a>
                  </DetailInfoRow>
                )}
                {!dataLoading && invoice?.stripePaymentIntentId && (
                  <DetailInfoRow icon={CreditCard} label="Stripe:" tone="blue">
                    <CopyableText value={invoice.stripePaymentIntentId}>
                      <span className="font-mono text-xs break-all">
                        {invoice.stripePaymentIntentId}
                      </span>
                    </CopyableText>
                  </DetailInfoRow>
                )}
                {!dataLoading && invoice?.creator && (
                  <AuditUserDetailRow
                    label="Created by:"
                    tone="violet"
                    user={invoice.creator}
                    href={resolveDetailAuditUserHref(
                      invoice.creator.id,
                      isAdminRole,
                    )}
                  />
                )}
                {!dataLoading && invoice?.updater && (
                  <AuditUserDetailRow
                    label="Updated by:"
                    tone="blue"
                    user={invoice.updater}
                    href={resolveDetailAuditUserHref(
                      invoice.updater.id,
                      isAdminRole,
                    )}
                  />
                )}
                {!dataLoading && invoice?.notes && (
                  <DetailInfoRow icon={StickyNote} label="Notes:" tone="teal">
                    {invoice.notes}
                  </DetailInfoRow>
                )}
              </div>
            </GlassCard>

            <InvoicePartiesCard
              invoice={invoice}
              dataLoading={dataLoading}
              isAdminRole={isAdminRole}
            />
          </div>

          {/* Actions — Back, Edit Invoice, Send Invoice, Delete Invoice; same layout as order detail */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {/* REQ-0163 — no variant=ghost (washes out sky glass; match Order Detail) */}
            <Button
              onClick={onBack}
              className={glassDetailBackButtonClass("w-full sm:w-auto gap-2")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            {/* REQ-0210 — cancelled invoices cannot be edited */}
            {invoice?.status !== "cancelled" && (
              <Button
                onClick={handleEditInvoice}
                disabled={actionsDisabled}
                className={glassDetailFooterButtonClass("blue")}
              >
                <Edit className="h-4 w-4 shrink-0" />
                Edit Invoice
              </Button>
            )}
            {!dataLoading && invoice && (
              <Button asChild className={glassDetailFooterButtonClass("teal")}>
                <a
                  href={`/api/invoices/${invoice.id}/pdf`}
                  download={`invoice-${invoice.invoiceNumber}.pdf`}
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Download PDF
                </a>
              </Button>
            )}
            {!dataLoading &&
              invoice &&
              invoice.status === "draft" &&
              !disableInvoiceMutations && (
                <DialogSubmitButton
                  type="button"
                  onClick={() => setSendDialogOpen(true)}
                  isPending={isSending}
                  pendingLabel="Sending…"
                  label="Send Invoice"
                  icon={Send}
                  hue="sky"
                  className="group w-full sm:w-auto gap-2"
                />
              )}
            {!dataLoading &&
              invoice &&
              invoice.status !== "cancelled" &&
              !disableInvoiceMutations && (
                <DialogSubmitButton
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  isPending={isDeleting}
                  pendingLabel="Deleting…"
                  label="Delete Invoice"
                  icon={Trash2}
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
              !isSupplierRole &&
              invoice &&
              invoice.status !== "paid" &&
              invoice.status !== "cancelled" &&
              invoice.amountDue > 0 && (
                <PaymentDialog
                  type="invoice"
                  id={invoice.id}
                  referenceNumber={invoice.invoiceNumber}
                  amount={invoice.amountDue}
                  amountPaid={invoice.amountPaid}
                  documentTotal={invoice.total}
                  subtotal={invoice.subtotal}
                  items={(invoice.linkedOrderItems ?? []).map((item) => ({
                    name: item.productName,
                    quantity: item.quantity,
                    price: item.subtotal,
                    imageUrl: item.imageUrl,
                  }))}
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
