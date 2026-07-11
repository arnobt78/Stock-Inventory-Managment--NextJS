"use client";

import React, { useCallback, useState, useEffect } from "react";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  MessageSquare,
  NotebookPen,
  Trash2,
  Send,
  User,
  Mail,
  Flag,
  CircleDot,
} from "lucide-react";
import {
  useSupportTicket,
  useUpdateSupportTicket,
  useDeleteSupportTicket,
  useSupportTicketReplies,
  useCreateSupportTicketReply,
} from "@/hooks/queries";
import {
  DeferredSelectGate,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
  DialogSubmitButton,
} from "@/components/shared";
import { TYPO_BODY, TYPO_BODY_MUTED } from "@/lib/ui/typography-scale";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { format } from "date-fns";
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketReply,
} from "@/types";
import { cn } from "@/lib/utils";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from "@/lib/ui/semantic-badges";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const variantConfig = {
  border: "border-violet-400/20",
  gradient:
    "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
  shadow:
    "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
};

export type AdminSupportTicketDetailContentProps = {
  initialTicket?: SupportTicket;
  /** SSR replies for first paint (REQ-0025 P2) */
  initialReplies?: SupportTicketReply[];
};

export default function AdminSupportTicketDetailContent({
  initialTicket,
  initialReplies,
}: AdminSupportTicketDetailContentProps = {}) {
  const params = useParams();
  const { navigateTo, handleBack } = useBackWithRefresh("support-ticket");
  const id = params?.id as string;
  const ticketQuery = useSupportTicket(id, initialTicket);
  const ticket = ticketQuery.data;
  const dataLoading = isDataSlotLoading(ticketQuery, initialTicket);
  const { isError, error } = ticketQuery;

  useSyncSsrQueryData(queryKeys.supportTickets.detail(id), initialTicket);
  useSyncSsrQueryData(
    [...queryKeys.supportTickets.detail(id), "replies"],
    initialReplies,
  );

  const updateMutation = useUpdateSupportTicket();
  const deleteMutation = useDeleteSupportTicket();
  const repliesQuery = useSupportTicketReplies(id, initialReplies);
  const replies = repliesQuery.data ?? initialReplies ?? [];
  const repliesLoading = isDataSlotLoading(repliesQuery, initialReplies);
  const createReply = useCreateSupportTicketReply(id);

  const [notes, setNotes] = useState("");
  const [notesTouched, setNotesTouched] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (!ticket || notesTouched) return;
    queueMicrotask(() => setNotes((ticket as SupportTicket).notes ?? ""));
  }, [ticket, notesTouched]);

  const handleStatusChange = useCallback(
    (newStatus: SupportTicketStatus) => {
      if (!id || newStatus === ticket?.status) return;
      updateMutation.mutate({ id, data: { status: newStatus } });
    },
    [id, ticket?.status, updateMutation],
  );

  const handlePriorityChange = useCallback(
    (newPriority: SupportTicketPriority) => {
      if (!id || newPriority === ticket?.priority) return;
      updateMutation.mutate({ id, data: { priority: newPriority } });
    },
    [id, ticket?.priority, updateMutation],
  );

  const handleSaveNotes = useCallback(() => {
    if (!id) return;
    updateMutation.mutate(
      { id, data: { notes: notes.trim() || null } },
      {
        onSuccess: () => {
          setNotesTouched(false);
        },
      },
    );
  }, [id, notes, updateMutation]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    // useDeleteSupportTicket.onSuccess calls cancelOrRemoveDetailQuery + invalidateAllRelatedQueries;
    // navigateTo triggers a second invalidation before push for belt-and-suspenders freshness.
    deleteMutation.mutate(id, {
      onSuccess: () => {
        navigateTo("/admin/support-tickets");
      },
    });
  }, [id, deleteMutation, navigateTo]);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    createReply.mutate(
      { body: replyBody.trim() },
      { onSuccess: () => setReplyBody("") },
    );
  };

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Support Tickets
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Ticket not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !ticket) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Support Tickets
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                The ticket you are looking for does not exist or was removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    );
  }

  const t = ticket as SupportTicket | undefined;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const notesValue = notesTouched ? notes : (t?.notes ?? "");
  const actionsDisabled = dataLoading || !ticket;

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <PageSectionHeader
          as="h1"
          tone="violet"
          icon={LifeBuoy}
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 shrink-0 self-center rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          <Card
            className={cn(
              "rounded-[20px] border backdrop-blur-md",
              variantConfig.border,
              variantConfig.gradient,
              variantConfig.shadow,
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <SectionCardHeader
                title="Status"
                description="Changes apply immediately"
                icon={CircleDot}
                tone="amber"
                className="mb-4"
              />
              <div className="flex flex-wrap items-center gap-2">
                {dataLoading ? (
                  <DataSlotPulse
                    variant="badge"
                    className="h-6 w-20 rounded-full"
                  />
                ) : (
                  <TicketStatusBadge status={t!.status} size="detail" />
                )}
                {!dataLoading && (
                  <DeferredSelectGate
                    placeholder={
                      <div
                        className="w-[160px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                        aria-hidden
                      >
                        {STATUS_OPTIONS.find((o) => o.value === t!.status)
                          ?.label ?? t!.status}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={t!.status}
                        onValueChange={(v) =>
                          handleStatusChange(v as SupportTicketStatus)
                        }
                        disabled={isUpdating || actionsDisabled}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <TicketStatusBadge
                                status={opt.value}
                                label={opt.label}
                                size="detail"
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "rounded-[20px] border backdrop-blur-md",
              variantConfig.border,
              variantConfig.gradient,
              variantConfig.shadow,
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <SectionCardHeader
                title="Priority"
                description="Changes apply immediately"
                icon={Flag}
                tone="rose"
                className="mb-4"
              />
              <div className="flex flex-wrap items-center gap-2">
                {dataLoading ? (
                  <DataSlotPulse
                    variant="badge"
                    className="h-6 w-16 rounded-full"
                  />
                ) : (
                  <TicketPriorityBadge status={t!.priority} size="detail" />
                )}
                {!dataLoading && (
                  <DeferredSelectGate
                    placeholder={
                      <div
                        className="w-[140px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                        aria-hidden
                      >
                        {PRIORITY_OPTIONS.find((o) => o.value === t!.priority)
                          ?.label ?? t!.priority}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={t!.priority}
                        onValueChange={(v) =>
                          handlePriorityChange(v as SupportTicketPriority)
                        }
                        disabled={isUpdating || actionsDisabled}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <TicketPriorityBadge
                                status={opt.value}
                                label={opt.label}
                                size="detail"
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-md",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <SectionCardHeader
                  title="Ticket Information"
                  description="Creator, dates, and ticket number"
                  icon={MessageSquare}
                  tone="violet"
                  className="mb-4"
                />
                <dl className={cn("space-y-2 text-sm", TYPO_BODY)}>
                  {!dataLoading && t!.ticketNumber && (
                    <div>
                      <dt className={TYPO_BODY_MUTED}>Ticket number</dt>
                      <dd className="font-mono text-xs">{t!.ticketNumber}</dd>
                    </div>
                  )}
                  <div>
                    <dt className={TYPO_BODY_MUTED}>Subject</dt>
                    <dd className="font-medium">
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-48" />
                      ) : (
                        t!.subject
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className={TYPO_BODY_MUTED}>Creator</dt>
                    <dd className="flex flex-col gap-0.5">
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-36" />
                      ) : (
                        <>
                          <Link
                            href={`/admin/user-management/${t!.userId}`}
                            className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1"
                          >
                            <User className="h-3.5 w-3.5" />
                            {t!.creatorName ?? t!.userId}
                          </Link>
                          {t!.creatorEmail && (
                            <span
                              className={cn(
                                "text-xs inline-flex items-center gap-1",
                                TYPO_BODY_MUTED,
                              )}
                            >
                              <Mail className="h-3 w-3" />
                              {t!.creatorEmail}
                            </span>
                          )}
                          <span
                            className={cn(
                              "font-mono text-xs",
                              TYPO_BODY_MUTED,
                            )}
                          >
                            ID: {t!.userId}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className={TYPO_BODY_MUTED}>Created</dt>
                    <dd>
                      {dataLoading ? (
                        <DataSlotPulse variant="date" />
                      ) : (
                        format(
                          new Date(t!.createdAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )
                      )}
                    </dd>
                  </div>
                  {!dataLoading && t!.updatedAt && (
                    <div>
                      <dt className={TYPO_BODY_MUTED}>Updated</dt>
                      <dd>
                        {format(
                          new Date(t!.updatedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <SectionCardHeader
                  title="Description"
                  description="Message submitted with the ticket"
                  icon={MessageSquare}
                  tone="neutral"
                  className="mb-4"
                />
                <p
                  className={cn(
                    "text-sm whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4",
                    TYPO_BODY_MUTED,
                  )}
                >
                  {dataLoading ? (
                    <DataSlotPulse
                      variant="text-md"
                      className="w-full min-h-[4rem]"
                    />
                  ) : (
                    t!.description
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-md",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardContent className="p-4 sm:p-5 space-y-2">
            <SectionCardHeader
              title="Reply to user"
              description="Send a message to the ticket creator. They will see this in the ticket thread and get a notification."
              icon={Send}
              tone="violet"
              className="mb-2"
            />
            {repliesLoading ? (
              <ul className="space-y-2 mb-4">
                {[1, 2].map((i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-border/50 bg-muted/20 p-4"
                  >
                    <DataSlotPulse variant="text-md" className="w-full mb-2" />
                    <DataSlotPulse variant="text-sm" className="w-32" />
                  </li>
                ))}
              </ul>
            ) : replies.length === 0 ? (
              <p className={cn("text-sm py-2", TYPO_BODY_MUTED)}>
                No replies yet. Add a reply below.
              </p>
            ) : (
              <ul className="space-y-2 mb-4">
                {replies.map((r) => {
                  const avatar = resolveAvatarSourcesFromSeed(
                    r.userId,
                    r.userImage,
                  );
                  const displayName =
                    r.userName?.trim() ||
                    r.userEmail ||
                    `User ${r.userId.slice(-8)}`;
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm"
                    >
                      <p className={cn("whitespace-pre-wrap", TYPO_BODY)}>
                        {r.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <SafeAvatarImage
                          src={avatar.src}
                          fallbackSrc={avatar.fallbackSrc}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover border border-border flex-shrink-0"
                        />
                        <span className={cn("text-xs font-medium", TYPO_BODY)}>
                          {displayName}
                        </span>
                        {r.userEmail && (
                          <span className={cn("text-xs", TYPO_BODY_MUTED)}>
                            {r.userEmail}
                          </span>
                        )}
                        <span className={cn("text-xs", TYPO_BODY_MUTED)}>
                          {format(
                            new Date(r.createdAt),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={handleSubmitReply} className="space-y-2">
              <Textarea
                placeholder="Write a reply to the user..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                disabled={createReply.isPending || actionsDisabled}
                className="min-h-[100px] rounded-xl resize-none"
              />
              <DialogSubmitButton
                type="submit"
                isPending={createReply.isPending}
                pendingLabel="Sending…"
                label="Send Reply"
                hue="violet"
                disabled={!replyBody.trim() || actionsDisabled}
                className="rounded-xl"
              />
            </form>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-md",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardContent className="p-4 sm:p-5 space-y-2">
            <SectionCardHeader
              title="Internal Notes"
              description="Admin-only notes. Not visible to the ticket creator."
              icon={NotebookPen}
              tone="neutral"
              className="mb-2"
            />
            <Textarea
              placeholder="Add internal notes..."
              value={notesValue}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesTouched(true);
              }}
              disabled={isUpdating || actionsDisabled}
              className="min-h-[100px] rounded-2xl resize-none"
            />
            {notesTouched && (
              <Button size="sm" onClick={handleSaveNotes} disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Notes
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            className={cn("w-full sm:w-auto gap-2 px-8", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DialogSubmitButton
                type="button"
                isPending={isDeleting}
                pendingLabel="Deleting…"
                label="Delete Ticket"
                hue="rose"
                disabled={actionsDisabled}
                className="w-full sm:w-auto gap-2 px-8"
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete support ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this ticket. This action cannot
                  be undone.
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
        </div>
      </div>
    </PageContentWrapper>
  );
}
