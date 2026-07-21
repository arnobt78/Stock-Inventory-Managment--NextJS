"use client";

/**
 * REQ-0191 — Client/supplier ticket detail: densify + chat + Edit/Delete when allowed.
 * REQ-0195 — Admin card parity (sky): Status/Priority/Messages, Ticket info, Description,
 * Related; no Internal Notes / Reassign. Non-admin user hrefs via resolveDetailAuditUserHref.
 * REQ-0196 — single GlassCard body pad (no inner p-2 sm:p-4).
 * REQ-0201 — Related Product densify (TicketRelatedProductDense).
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import {
  PageContentWrapper,
  ClientDateTime,
  PersonNameEmailCell,
  CopyableText,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import { TicketRelatedProductDense } from "@/components/support-tickets/TicketRelatedProductDense";
import { GlassCard, DetailInfoRow } from "@/components/orders/detail";
import {
  APP_SHELL_DETAIL_CLASS,
  DETAIL_PAGE_HEADER_SPACING_CLASS,
} from "@/lib/ui/shell-layout-styles";
import { DETAIL_DATA_VALUE_CLASS } from "@/lib/ui/typography-scale";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import {
  useSupportTicket,
  useSupportTicketReplies,
  useDeleteSupportTicket,
} from "@/hooks/queries";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryDataMany,
} from "@/lib/react-query";
import {
  MessageSquare,
  ArrowLeft,
  Pencil,
  Trash2,
  LifeBuoy,
  CircleDot,
  Flag,
  MessagesSquare,
  Hash,
  User,
  UserRoundPen,
  Calendar,
  Package,
  Boxes,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  TicketStatusBadge,
  TicketPriorityBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/lib/ui/semantic-badges";
import { useAuth } from "@/contexts";
import SupportTicketDialog from "@/components/support-tickets/SupportTicketDialog";
import SupportTicketReplyThread from "@/components/support-tickets/SupportTicketReplyThread";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";
import { computeTicketMessageStats } from "@/lib/support-tickets/ticket-message-stats";
import type {
  ProductOwnerOption,
  SupportTicket,
  SupportTicketReply,
} from "@/types";

export type SupportTicketDetailContentProps = {
  initialTicket: SupportTicket;
  initialReplies?: SupportTicketReply[];
  productOwners?: ProductOwnerOption[];
};

export default function SupportTicketDetailContent({
  initialTicket,
  initialReplies,
  productOwners = [],
}: SupportTicketDetailContentProps) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const { navigateTo, handleBack } = useBackWithRefresh("support-ticket");
  const ticketQuery = useSupportTicket(initialTicket.id, initialTicket);
  const ticket = ticketQuery.data ?? initialTicket;
  const dataLoading = isDataSlotLoading(ticketQuery, initialTicket);

  useSyncSsrQueryDataMany([
    {
      queryKey: queryKeys.supportTickets.detail(initialTicket.id),
      serverData: initialTicket,
    },
    {
      queryKey: [
        ...queryKeys.supportTickets.detail(initialTicket.id),
        "replies",
      ],
      serverData: initialReplies,
    },
  ]);

  const repliesQuery = useSupportTicketReplies(ticket.id, initialReplies);
  const replies = repliesQuery.data ?? initialReplies ?? [];
  const repliesLoading = isDataSlotLoading(repliesQuery, initialReplies);
  const deleteMutation = useDeleteSupportTicket();
  const isDeleting = deleteMutation.isPending;

  const sessionId = user?.id;
  const canMutate =
    !!sessionId &&
    (ticket.userId === sessionId || ticket.assignedToId === sessionId);

  // REQ-0192/0195 — opening description + replies
  const messageStats = useMemo(
    () => computeTicketMessageStats(ticket.userId, replies),
    [replies, ticket],
  );

  const hasRelated =
    !!ticket.productId || !!ticket.orderId || !!ticket.supplierId;

  const descPreview = (ticket.description ?? "").trim();
  const deleteDescription =
    descPreview.length > 80
      ? `This will permanently delete the ticket "${ticket.subject}": ${descPreview.slice(0, 80)}…`
      : `This will permanently delete the ticket "${ticket.subject}". This action cannot be undone.`;

  const handleDelete = () => {
    deleteMutation.mutate(ticket.id, {
      onSuccess: () => navigateTo("/support-tickets"),
    });
  };

  const t = ticket;
  const actionsDisabled = dataLoading || isDeleting;

  return (
    <Navbar>
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <PageSectionHeader
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            icon={LifeBuoy}
            tone="sky"
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
                t.subject
              )
            }
          />

          {/* Status | Priority | Messages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 items-stretch">
            <GlassCard variant="amber">
<SectionCardHeader
                  title="Status"
                  description="Workflow state — managed by support staff"
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
                  <TicketStatusBadge status={t.status} size="detail" />
                )}
            </GlassCard>

            <GlassCard variant="rose">
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
                    status={t.priority}
                    size="detail"
                    contrast="opaque"
                  />
                )}
            </GlassCard>

            <GlassCard variant="sky">
<SectionCardHeader
                  title="Messages"
                  description="Opening description + thread replies"
                  icon={MessagesSquare}
                  tone="sky"
                  className="mb-4"
                />
                {repliesLoading && replies.length === 0 ? (
                  <DataSlotPulse variant="text-md" className="w-32" />
                ) : (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className={DETAIL_DATA_VALUE_CLASS}>
                      Total{" "}
                      <span className="text-sky-600 dark:text-sky-300 font-medium">
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
            </GlassCard>
          </div>

          {/* Ticket information | Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
            <GlassCard variant="sky">
<SectionCardHeader
                  title="Ticket information"
                  description="Creator, Send-to, dates, and ticket number"
                  icon={Hash}
                  tone="sky"
                  className="mb-4"
                />
                {dataLoading ? (
                  <DataSlotPulse variant="text-md" className="w-full h-24" />
                ) : (
                  <div className="space-y-2">
                    <DetailInfoRow
                      icon={Hash}
                      label="Ticket #:"
                      tone="sky"
                      valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                    >
                      <CopyableText
                        value={t.ticketNumber ?? t.id}
                        className="text-sky-600 dark:text-sky-300"
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
                        href={resolveDetailAuditUserHref(t.userId, false)}
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
                          href={resolveDetailAuditUserHref(
                            t.assignedToId,
                            false,
                          )}
                          avatarSize={28}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          — No specific owner —
                        </span>
                      )}
                    </DetailInfoRow>
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
                          valueClassName={cn(
                            "text-sm",
                            DETAIL_DATA_VALUE_CLASS,
                          )}
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
            </GlassCard>

            <GlassCard variant="amber">
<SectionCardHeader
                  title="Description"
                  description="Message submitted with the ticket"
                  icon={MessageSquare}
                  tone="amber"
                  className="mb-4"
                />
                {dataLoading ? (
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
            </GlassCard>
          </div>

          {/* REQ-0201 — Related Product densify; non-admin catalog paths */}
          {!dataLoading && hasRelated ? (
            <GlassCard variant="sky">
              <SectionCardHeader
                title="Related Product"
                description="Linked product, order, or supplier for quick overview"
                icon={Package}
                tone="sky"
                className="mb-4"
              />
              <div className="space-y-3">
                  {t.productId ? (
                    <TicketRelatedProductDense
                      productId={t.productId}
                      productHref={`/products/${t.productId}`}
                      name={
                        t.relatedProductName?.trim() || t.productId.slice(-8)
                      }
                      sku={t.relatedProductSku}
                      imageUrl={t.relatedProductImageUrl}
                      price={t.relatedProductPrice}
                      quantity={t.relatedProductQuantity}
                      categoryName={t.relatedProductCategoryName}
                      ownerId={t.relatedProductOwnerId}
                      ownerName={t.relatedProductOwnerName}
                      ownerImage={t.relatedProductOwnerImage}
                      supplierId={t.relatedProductSupplierId}
                      supplierName={t.relatedProductSupplierName}
                      supplierImage={t.relatedProductSupplierImage}
                    />
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
                          href={`/orders/${t.orderId}`}
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
                        href={`/suppliers/${t.supplierId}`}
                        className={TABLE_CATALOG_LINK_CLASS}
                      >
                        {t.relatedSupplierName ?? t.supplierId.slice(-8)}
                      </Link>
                    </DetailInfoRow>
                  ) : null}
                </div>
            </GlassCard>
          ) : null}

          {!dataLoading ? (
            <SupportTicketReplyThread
              ticket={t}
              replies={replies}
              repliesLoading={repliesLoading}
              variant="sky"
              sessionUserId={user?.id}
              isAdminRole={user?.role === "admin"}
              authorHrefForUserId={(userId) =>
                resolveDetailAuditUserHref(userId, false)
              }
            />
          ) : (
            <DataSlotPulse variant="text-md" className="w-full h-40" />
          )}

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleBack}
              className={glassDetailBackButtonClass(
                "w-full sm:w-auto gap-2 px-8",
              )}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            {canMutate ? (
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
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>

          {canMutate ? (
            <SupportTicketDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              productOwners={productOwners}
              existingTicket={ticket}
              variant="sky"
            />
          ) : null}
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
