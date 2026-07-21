"use client";

/**
 * REQ-0191 — Support ticket detail (review parity): read-only Status/Priority/Messages,
 * densified Ticket info + Sent to, chat replies, notes header edit, footer Edit/Reassign/Delete.
 */

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { GlassCard, DetailInfoRow } from "@/components/orders/detail";
import {
  APP_SHELL_DETAIL_CLASS,
  DETAIL_PAGE_HEADER_SPACING_CLASS,
} from "@/lib/ui/shell-layout-styles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  LifeBuoy,
  MessageSquare,
  NotebookPen,
  User,
  Flag,
  CircleDot,
  Calendar,
  Hash,
  Pencil,
  Trash2,
  UserRoundPen,
  Check,
  X,
  Package,
  Boxes,
  Building2,
  MessagesSquare,
} from "lucide-react";
import {
  useSupportTicket,
  useUpdateSupportTicket,
  useDeleteSupportTicket,
  useSupportTicketReplies,
} from "@/hooks/queries";
import {
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  ClientDateTime,
  PersonNameEmailCell,
  CopyableText,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import { DETAIL_DATA_VALUE_CLASS } from "@/lib/ui/typography-scale";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryDataMany,
} from "@/lib/react-query";
import type {
  ProductOwnerOption,
  SupportTicket,
  SupportTicketReply,
} from "@/types";
import { cn } from "@/lib/utils";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/lib/ui/semantic-badges";
import { useAuth } from "@/contexts";
import SupportTicketDialog from "@/components/support-tickets/SupportTicketDialog";
import TicketReassignDialog from "@/components/support-tickets/TicketReassignDialog";
import SupportTicketReplyThread from "@/components/support-tickets/SupportTicketReplyThread";
import { AlertDialogWrapper } from "@/components/dialogs";
import { computeTicketMessageStats } from "@/lib/support-tickets/ticket-message-stats";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";

export type AdminSupportTicketDetailContentProps = {
  initialTicket?: SupportTicket;
  initialReplies?: SupportTicketReply[];
  /** REQ-0191 — for footer Reassign */
  productOwners?: ProductOwnerOption[];
};

export default function AdminSupportTicketDetailContent({
  initialTicket,
  initialReplies,
  productOwners = [],
}: AdminSupportTicketDetailContentProps = {}) {
  const params = useParams();
  const { user } = useAuth();
  const { navigateTo, handleBack } = useBackWithRefresh("support-ticket");
  const id = params?.id as string;
  const ticketQuery = useSupportTicket(id, initialTicket);
  const ticket = ticketQuery.data;
  const dataLoading = isDataSlotLoading(ticketQuery, initialTicket);
  const { isError, error } = ticketQuery;

  useSyncSsrQueryDataMany([
    {
      queryKey: queryKeys.supportTickets.detail(id),
      serverData: initialTicket,
    },
    {
      queryKey: [...queryKeys.supportTickets.detail(id), "replies"],
      serverData: initialReplies,
    },
  ]);

  const updateMutation = useUpdateSupportTicket();
  const deleteMutation = useDeleteSupportTicket();
  const repliesQuery = useSupportTicketReplies(id, initialReplies);
  const replies = repliesQuery.data ?? initialReplies ?? [];
  const repliesLoading = isDataSlotLoading(repliesQuery, initialReplies);

  const [editOpen, setEditOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  /** REQ-0193 — confirm before clearing internal notes */
  const [notesClearOpen, setNotesClearOpen] = useState(false);

  const sessionId = user?.id;
  const isAdmin = user?.role === "admin";
  const canMutate =
    !!ticket &&
    !!sessionId &&
    (isAdmin ||
      ticket.userId === sessionId ||
      ticket.assignedToId === sessionId);
  const canReassign = isAdmin && productOwners.length > 0;

  // REQ-0192 — opening description + replies (parity with table 1 + replyCount)
  // Deps: full `ticket` (not ticket?.userId) so React Compiler can preserve memoization
  const messageStats = useMemo(
    () =>
      ticket
        ? computeTicketMessageStats(ticket.userId, replies)
        : { total: 0, fromCreator: 0, fromStaff: 0 },
    [replies, ticket],
  );

  const hasRelated =
    !!ticket && (!!ticket.productId || !!ticket.orderId || !!ticket.supplierId);

  const actionsDisabled =
    dataLoading || updateMutation.isPending || deleteMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const startNotesEdit = () => {
    setNotesDraft(ticket?.notes ?? "");
    setNotesEditing(true);
  };

  const cancelNotesEdit = () => {
    setNotesEditing(false);
    setNotesDraft(ticket?.notes ?? "");
  };

  const saveNotes = () => {
    if (!id) return;
    updateMutation.mutate(
      { id, data: { notes: notesDraft.trim() || null } },
      { onSuccess: () => setNotesEditing(false) },
    );
  };

  const clearNotes = () => {
    if (!id) return;
    updateMutation.mutate(
      { id, data: { notes: null } },
      {
        onSuccess: () => {
          setNotesEditing(false);
          setNotesDraft("");
          setNotesClearOpen(false);
        },
      },
    );
  };

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        navigateTo("/admin/support-tickets");
      },
    });
  }, [id, deleteMutation, navigateTo]);

  const descPreview = (ticket?.description ?? "").trim();
  const deleteDescription =
    descPreview.length > 80
      ? `This will permanently delete the ticket "${ticket?.subject}": ${descPreview.slice(0, 80)}…`
      : ticket
        ? `This will permanently delete the ticket "${ticket.subject}". This action cannot be undone.`
        : "This will permanently delete this support ticket.";

  // REQ-0193 — dynamic confirm copy for clear-notes (subject + notes preview)
  const notesPreview = (ticket?.notes ?? "").trim();
  const clearNotesDescription =
    notesPreview.length > 80
      ? `Clear internal notes for "${ticket?.subject}": ${notesPreview.slice(0, 80)}…`
      : ticket && notesPreview
        ? `Clear internal notes for "${ticket.subject}": ${notesPreview}`
        : ticket
          ? `Clear internal notes for "${ticket.subject}"? This cannot be undone.`
          : "Clear internal notes for this ticket?";

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="p-6 text-destructive">
          {error instanceof Error ? error.message : "Failed to load ticket"}
        </div>
      </PageContentWrapper>
    );
  }

  const t = ticket;

  return (
    <PageContentWrapper>
      <div className={APP_SHELL_DETAIL_CLASS}>
        <PageSectionHeader
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
          icon={LifeBuoy}
          tone="violet"
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={DETAIL_HEADER_BACK_ICON_CLASS}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          }
          title="Support Ticket Details"
          description={
            dataLoading ? (
              <DataSlotPulse variant="text-md" className="w-64" />
            ) : (
              t!.subject
            )
          }
        />

        {/* Status | Priority | Messages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 items-stretch">
          <GlassCard variant="amber">
            <div className="p-2 sm:p-4">
              <SectionCardHeader
                title="Status"
                description="Ticket workflow state — edit via Edit Ticket"
                icon={CircleDot}
                tone="amber"
                className="mb-4"
              />
              {dataLoading ? (
                <DataSlotPulse
                  variant="badge"
                  className="h-6 w-20 rounded-full"
                />
              ) : (
                <TicketStatusBadge status={t!.status} size="detail" />
              )}
            </div>
          </GlassCard>

          <GlassCard variant="rose">
            <div className="p-2 sm:p-4">
              <SectionCardHeader
                title="Priority"
                description="Urgency — edit via Edit Ticket"
                icon={Flag}
                tone="rose"
                className="mb-4"
              />
              {dataLoading ? (
                <DataSlotPulse
                  variant="badge"
                  className="h-6 w-16 rounded-full"
                />
              ) : (
                <TicketPriorityBadge
                  status={t!.priority}
                  size="detail"
                  contrast="opaque"
                />
              )}
            </div>
          </GlassCard>

          <GlassCard variant="violet">
            <div className="p-2 sm:p-4">
              <SectionCardHeader
                title="Messages"
                description="Opening description + thread replies"
                icon={MessagesSquare}
                tone="violet"
                className="mb-4"
              />
              {repliesLoading && replies.length === 0 ? (
                <DataSlotPulse variant="text-md" className="w-32" />
              ) : (
                <div className="flex flex-col gap-1 text-sm">
                  <span className={DETAIL_DATA_VALUE_CLASS}>
                    Total{" "}
                    <span className="text-violet-600 dark:text-violet-300 font-medium">
                      {messageStats.total}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    From creator{" "}
                    <span className="text-sky-600 dark:text-sky-300">
                      {messageStats.fromCreator}
                    </span>
                    {" · "}
                    From staff{" "}
                    <span className="text-emerald-600 dark:text-emerald-300">
                      {messageStats.fromStaff}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Ticket information | Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
          <GlassCard variant="violet">
            <div className="p-2 sm:p-4">
              <SectionCardHeader
                title="Ticket information"
                description="Creator, Send-to, dates, and ticket number"
                icon={Hash}
                tone="violet"
                className="mb-4"
              />
              {dataLoading || !t ? (
                <DataSlotPulse variant="text-md" className="w-full h-24" />
              ) : (
                <div className="space-y-2">
                  <DetailInfoRow
                    icon={Hash}
                    label="Ticket #:"
                    tone="violet"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    <CopyableText
                      value={t.ticketNumber ?? t.id}
                      className="text-violet-600 dark:text-violet-300"
                    >
                      {t.ticketNumber ?? t.id}
                    </CopyableText>
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={MessageSquare}
                    label="Subject:"
                    tone="emerald"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    <span className="text-emerald-600 dark:text-emerald-300 font-normal">
                      {t.subject}
                    </span>
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={User}
                    label="Creator:"
                    tone="sky"
                    valueClassName="min-w-0"
                  >
                    <PersonNameEmailCell
                      seed={t.userId}
                      name={
                        t.creatorName?.trim() ||
                        t.creatorEmail ||
                        t.userId.slice(-8)
                      }
                      email={t.creatorEmail}
                      image={t.creatorImage}
                      href={`/admin/user-management/${t.userId}`}
                      avatarSize={28}
                    />
                  </DetailInfoRow>
                  <DetailInfoRow
                    icon={UserRoundPen}
                    label="Sent to:"
                    tone="teal"
                    valueClassName="min-w-0"
                  >
                    {t.assignedToId ? (
                      <PersonNameEmailCell
                        seed={t.assignedToId}
                        name={
                          t.assignedToName?.trim() ||
                          t.assignedToEmail ||
                          t.assignedToId.slice(-8)
                        }
                        email={t.assignedToEmail}
                        image={t.assignedToImage}
                        href={`/admin/user-management/${t.assignedToId}`}
                        avatarSize={28}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        — No specific owner —
                      </span>
                    )}
                  </DetailInfoRow>
                  {/* REQ-0191 — Created | Updated same responsive row */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 [&>*]:flex-1 [&>*]:min-w-0">
                    <DetailInfoRow
                      icon={Calendar}
                      label="Created:"
                      tone="orange"
                      valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                    >
                      <ClientDateTime
                        date={new Date(t.createdAt)}
                        semantic="created"
                      />
                    </DetailInfoRow>
                    {t.updatedAt ? (
                      <DetailInfoRow
                        icon={Calendar}
                        label="Updated:"
                        tone="amber"
                        valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                      >
                        <ClientDateTime
                          date={new Date(t.updatedAt)}
                          semantic="updated"
                        />
                      </DetailInfoRow>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="amber">
            <div className="p-2 sm:p-4">
              <SectionCardHeader
                title="Description"
                description="Message submitted with the ticket"
                icon={MessageSquare}
                tone="amber"
                className="mb-4"
              />
              {dataLoading || !t ? (
                <DataSlotPulse variant="text-md" className="w-full h-24" />
              ) : (
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4",
                    "font-normal text-sm text-emerald-600 dark:text-emerald-300",
                  )}
                >
                  {t.description}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Related context */}
        {!dataLoading && t && hasRelated ? (
          <GlassCard variant="sky">
            <div className="p-2 sm:p-4">
              <SectionCardHeader
                title="Related"
                description="Linked product, order, or supplier for quick overview"
                icon={Boxes}
                tone="sky"
                className="mb-4"
              />
              <div className="space-y-2">
                {t.productId ? (
                  <DetailInfoRow
                    icon={Package}
                    label="Product:"
                    tone="sky"
                    valueClassName="min-w-0"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <Link
                        href={`/admin/products/${t.productId}`}
                        className={TABLE_CATALOG_LINK_CLASS}
                      >
                        {t.relatedProductName ?? t.productId.slice(-8)}
                      </Link>
                      {t.relatedProductSku ? (
                        <CopyableText
                          value={t.relatedProductSku}
                          className="text-xs text-muted-foreground dark:text-muted-foreground"
                        >
                          {t.relatedProductSku}
                        </CopyableText>
                      ) : null}
                    </div>
                  </DetailInfoRow>
                ) : null}
                {t.orderId ? (
                  <DetailInfoRow
                    icon={Boxes}
                    label="Order:"
                    tone="emerald"
                    valueClassName="min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${t.orderId}`}
                        className={TABLE_CATALOG_LINK_CLASS}
                      >
                        {t.relatedOrderNumber ?? t.orderId.slice(-8)}
                      </Link>
                      {t.relatedOrderStatus ? (
                        <OrderStatusBadge
                          status={t.relatedOrderStatus}
                          size="compact"
                        />
                      ) : null}
                      {t.relatedOrderPaymentStatus ? (
                        <PaymentStatusBadge
                          status={t.relatedOrderPaymentStatus}
                          size="compact"
                        />
                      ) : null}
                    </div>
                  </DetailInfoRow>
                ) : null}
                {t.supplierId ? (
                  <DetailInfoRow
                    icon={Building2}
                    label="Supplier:"
                    tone="amber"
                    valueClassName="min-w-0"
                  >
                    <Link
                      href={`/admin/suppliers/${t.supplierId}`}
                      className={TABLE_CATALOG_LINK_CLASS}
                    >
                      {t.relatedSupplierName ?? t.supplierId.slice(-8)}
                    </Link>
                  </DetailInfoRow>
                ) : null}
              </div>
            </div>
          </GlassCard>
        ) : null}

        {/* Reply thread */}
        {!dataLoading && t ? (
          <SupportTicketReplyThread
            ticket={t}
            replies={replies}
            repliesLoading={repliesLoading}
            variant="violet"
            creatorHref={`/admin/user-management/${t.userId}`}
            authorHrefForUserId={(userId) =>
              resolveDetailAuditUserHref(userId, true)
            }
          />
        ) : (
          <DataSlotPulse variant="text-md" className="w-full h-40" />
        )}

        {/* Internal Notes — admin header edit/delete */}
        <GlassCard variant="teal">
          <div className="p-2 sm:p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <SectionCardHeader
                title="Internal Notes"
                description="Admin-only notes. Not visible to the ticket creator."
                icon={NotebookPen}
                tone="teal"
              />
              {!notesEditing ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={startNotesEdit}
                    disabled={actionsDisabled || dataLoading}
                    aria-label="Edit notes"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600"
                    onClick={() => setNotesClearOpen(true)}
                    disabled={
                      actionsDisabled ||
                      dataLoading ||
                      !(t?.notes && t.notes.trim())
                    }
                    aria-label="Clear notes"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={cancelNotesEdit}
                    disabled={updateMutation.isPending}
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600"
                    onClick={saveNotes}
                    disabled={updateMutation.isPending}
                    aria-label="Save notes"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {dataLoading ? (
              <DataSlotPulse variant="text-md" className="w-full h-16" />
            ) : notesEditing ? (
              <Textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                disabled={updateMutation.isPending}
                className="min-h-[100px] rounded-xl resize-none"
                placeholder="Internal notes…"
              />
            ) : (
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm text-gray-700 dark:text-white",
                  !t?.notes?.trim() && "text-muted-foreground italic",
                )}
              >
                {t?.notes?.trim() || "No internal notes yet."}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            onClick={handleBack}
            className={glassDetailBackButtonClass(
              "w-full sm:w-auto gap-2 px-8",
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back
          </Button>
          {canMutate && t ? (
            <Button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={actionsDisabled}
              className={glassDetailFooterButtonClass(
                "amber",
                "w-full sm:w-auto gap-2 px-8",
              )}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              Edit Ticket
            </Button>
          ) : null}
          {canReassign && t ? (
            <Button
              type="button"
              onClick={() => setReassignOpen(true)}
              disabled={actionsDisabled}
              className={glassDetailFooterButtonClass(
                "violet",
                "w-full sm:w-auto gap-2 px-8",
              )}
            >
              <UserRoundPen className="h-4 w-4 shrink-0" />
              Reassign Ticket
            </Button>
          ) : null}
          {canMutate ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DialogSubmitButton
                  type="button"
                  isPending={isDeleting}
                  pendingLabel="Deleting…"
                  label="Delete Ticket"
                  icon={Trash2}
                  hue="rose"
                  disabled={actionsDisabled}
                  className="w-full sm:w-auto gap-2 px-8"
                />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete support ticket?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting || actionsDisabled}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        {t ? (
          <>
            <SupportTicketDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              productOwners={productOwners}
              existingTicket={t}
              variant="violet"
            />
            {canReassign ? (
              <TicketReassignDialog
                ticket={t}
                productOwners={productOwners}
                open={reassignOpen}
                onOpenChange={setReassignOpen}
                variant="violet"
              />
            ) : null}
            {/* REQ-0193 — clear notes confirm with subject + preview */}
            <AlertDialogWrapper
              open={notesClearOpen}
              onOpenChange={setNotesClearOpen}
              title="Clear internal notes?"
              description={clearNotesDescription}
              actionLabel="Clear notes"
              actionLoadingLabel="Clearing…"
              isLoading={updateMutation.isPending}
              onAction={clearNotes}
              onCancel={() => setNotesClearOpen(false)}
              actionVariant="destructive"
            />
          </>
        ) : null}
      </div>
    </PageContentWrapper>
  );
}
