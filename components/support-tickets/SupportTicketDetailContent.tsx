"use client";

/**
 * REQ-0191 — Client/supplier ticket detail: densify + chat thread + Edit/Delete when allowed.
 */

import React, { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import {
  PageContentWrapper,
  ClientDateTime,
  PersonNameEmailCell,
  CopyableText,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DialogSubmitButton,
} from "@/components/shared";
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
import { MessageSquare, ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
} from "@/lib/ui/semantic-badges";
import { useAuth } from "@/contexts";
import SupportTicketDialog from "@/components/support-tickets/SupportTicketDialog";
import SupportTicketReplyThread from "@/components/support-tickets/SupportTicketReplyThread";
import { resolveDetailAuditUserHref } from "@/lib/navigation/audit-user-href";
import type {
  ProductOwnerOption,
  SupportTicket,
  SupportTicketReply,
} from "@/types";

const variantConfig = {
  border: "border-sky-400/20",
  gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
  shadow:
    "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
  iconBg:
    "border-sky-300/30 bg-sky-100/50 dark:border-sky-400/30 dark:bg-sky-500/20",
};

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
  const { navigateTo } = useBackWithRefresh("support-ticket");
  const { data: ticket = initialTicket } = useSupportTicket(initialTicket.id);

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

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="space-y-4 poppins">
          <article
            className={cn(
              "rounded-[20px] border p-2 sm:p-4 backdrop-blur-md",
              "bg-white/60 dark:bg-white/5",
              variantConfig.border,
              variantConfig.gradient,
              variantConfig.shadow,
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border shrink-0",
                  variantConfig.iconBg,
                )}
              >
                <MessageSquare className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                {ticket.ticketNumber ? (
                  <CopyableText
                    value={ticket.ticketNumber}
                    className="text-xs font-mono text-sky-600 dark:text-sky-400 mb-1"
                  >
                    {ticket.ticketNumber}
                  </CopyableText>
                ) : null}
                <h1 className="text-sm sm:text-lg font-medium text-emerald-600 dark:text-emerald-300">
                  {ticket.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <TicketStatusBadge status={ticket.status} size="detail" />
                  <TicketPriorityBadge
                    status={ticket.priority}
                    size="detail"
                    contrast="opaque"
                  />
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Creator
                    </span>
                    <PersonNameEmailCell
                      seed={ticket.userId}
                      name={
                        ticket.creatorName?.trim() ||
                        ticket.creatorEmail ||
                        "—"
                      }
                      email={ticket.creatorEmail}
                      image={ticket.creatorImage}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Sent to
                    </span>
                    {ticket.assignedToId ? (
                      <PersonNameEmailCell
                        seed={ticket.assignedToId}
                        name={
                          ticket.assignedToName?.trim() ||
                          ticket.assignedToEmail ||
                          "—"
                        }
                        email={ticket.assignedToEmail}
                        image={ticket.assignedToImage}
                        href={`/products?ownerId=${ticket.assignedToId}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        — No specific owner —
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs">
                  <span>
                    <span className="text-muted-foreground">Created: </span>
                    <ClientDateTime
                      date={ticket.createdAt}
                      semantic="created"
                    />
                  </span>
                  {ticket.updatedAt ? (
                    <span>
                      <span className="text-muted-foreground">Updated: </span>
                      <ClientDateTime
                        date={ticket.updatedAt}
                        semantic="updated"
                      />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/40 dark:bg-white/5 border border-sky-200/30 dark:border-white/10 p-4">
              <p className="text-sm text-gray-700 dark:text-white whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </article>

          <SupportTicketReplyThread
            ticket={ticket}
            replies={replies}
            repliesLoading={repliesLoading}
            variant="sky"
            authorHrefForUserId={(userId) =>
              resolveDetailAuditUserHref(userId, false)
            }
          />

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => navigateTo("/support-tickets")}
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
