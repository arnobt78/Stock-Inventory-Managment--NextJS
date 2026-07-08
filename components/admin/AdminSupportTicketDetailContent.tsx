"use client";

import React, { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Loader2,
  MessageSquare,
  Trash2,
  Send,
  User,
  Mail,
} from "lucide-react";
import {
  useSupportTicket,
  useUpdateSupportTicket,
  useDeleteSupportTicket,
  useSupportTicketReplies,
  useCreateSupportTicketReply,
} from "@/hooks/queries";
import { DeferredSelectGate, PageContentWrapper } from "@/components/shared";
import { format } from "date-fns";
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
} from "@/types";
import { cn } from "@/lib/utils";

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

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "resolved":
      return "secondary";
    case "closed":
      return "secondary";
    default:
      return "outline";
  }
}

const variantConfig = {
  border: "border-violet-400/20",
  gradient:
    "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
  shadow:
    "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
};

function statusBadgeColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300/30 shadow-[0_4px_12px_rgba(245,158,11,0.2)]";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300/30 shadow-[0_4px_12px_rgba(59,130,246,0.2)]";
    case "resolved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300/30 shadow-[0_4px_12px_rgba(16,185,129,0.2)]";
    case "closed":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300/30 shadow-[0_4px_12px_rgba(107,114,128,0.2)]";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300/30";
  }
}

function priorityBadgeColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300/30 shadow-[0_4px_12px_rgba(239,68,68,0.2)]";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300/30 shadow-[0_4px_12px_rgba(249,115,22,0.2)]";
    case "medium":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300/30 shadow-[0_4px_12px_rgba(2,132,199,0.2)]";
    case "low":
      return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border-slate-300/30 shadow-[0_4px_12px_rgba(100,116,139,0.2)]";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300/30";
  }
}

export default function AdminSupportTicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: ticket, isLoading, isError, error } = useSupportTicket(id);
  const updateMutation = useUpdateSupportTicket();
  const deleteMutation = useDeleteSupportTicket();
  const { data: replies = [], isLoading: repliesLoading } =
    useSupportTicketReplies(id);
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
    deleteMutation.mutate(id, {
      onSuccess: () => {
        router.push("/admin/support-tickets");
      },
    });
  }, [id, deleteMutation, router]);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    createReply.mutate(
      { body: replyBody.trim() },
      { onSuccess: () => setReplyBody("") },
    );
  };

  if (isError || (!isLoading && !ticket)) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/support-tickets" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Support Tickets
            </Link>
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

  if (isLoading || !ticket) {
    return (
      <PageContentWrapper>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContentWrapper>
    );
  }

  const t = ticket as SupportTicket;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const notesValue = notesTouched ? notes : (t.notes ?? "");

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/support-tickets" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              Support Ticket Details
            </h1>
            <p className="text-sm text-muted-foreground">{t.subject}</p>
          </div>
        </div>

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-sm",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ticket Information
                </h2>
                <dl className="space-y-2 text-sm">
                  {t.ticketNumber && (
                    <div>
                      <dt className="text-muted-foreground">Ticket number</dt>
                      <dd className="font-mono text-xs text-foreground">
                        {t.ticketNumber}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Subject</dt>
                    <dd className="font-medium">{t.subject}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Creator</dt>
                    <dd className="flex flex-col gap-0.5">
                      <Link
                        href={`/admin/user-management/${t.userId}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1"
                      >
                        <User className="h-3.5 w-3.5" />
                        {t.creatorName ?? t.userId}
                      </Link>
                      {t.creatorEmail && (
                        <span className="text-muted-foreground text-xs inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {t.creatorEmail}
                        </span>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        ID: {t.userId}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>
                      {format(
                        new Date(t.createdAt),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </dd>
                  </div>
                  {t.updatedAt && (
                    <div>
                      <dt className="text-muted-foreground">Updated</dt>
                      <dd>
                        {format(
                          new Date(t.updatedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          statusBadgeColor(t.status),
                        )}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                      <DeferredSelectGate
                        placeholder={
                          <div
                            className="w-[160px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                            aria-hidden
                          >
                            {STATUS_OPTIONS.find((o) => o.value === t.status)
                              ?.label ?? t.status}
                          </div>
                        }
                      >
                        {({ selectRemountKey }) => (
                          <Select
                            key={selectRemountKey}
                            value={t.status}
                            onValueChange={(v) =>
                              handleStatusChange(v as SupportTicketStatus)
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-[160px]",
                                getStatusVariant(t.status) === "destructive" &&
                                  "border-destructive text-destructive",
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </DeferredSelectGate>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Priority</dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          priorityBadgeColor(t.priority),
                        )}
                      >
                        {t.priority}
                      </span>
                      <DeferredSelectGate
                        placeholder={
                          <div
                            className="w-[140px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                            aria-hidden
                          >
                            {PRIORITY_OPTIONS.find(
                              (o) => o.value === t.priority,
                            )?.label ?? t.priority}
                          </div>
                        }
                      >
                        {({ selectRemountKey }) => (
                          <Select
                            key={selectRemountKey}
                            value={t.priority}
                            onValueChange={(v) =>
                              handlePriorityChange(v as SupportTicketPriority)
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </DeferredSelectGate>
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4">
                  {t.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-sm",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardHeader>
            <CardTitle>Reply to user</CardTitle>
            <CardDescription>
              Send a message to the ticket creator. They will see this in the
              ticket thread and get a notification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {repliesLoading ? (
              <div className="h-16 rounded-xl bg-muted/30 animate-pulse" />
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No replies yet. Add a reply below.
              </p>
            ) : (
              <ul className="space-y-2 mb-4">
                {replies.map((r) => {
                  const avatarSrc =
                    r.userImage ||
                    `https://robohash.org/${encodeURIComponent(r.userId)}?set=set1&size=80x80`;
                  const displayName =
                    r.userName?.trim() ||
                    r.userEmail ||
                    `User ${r.userId.slice(-8)}`;
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm"
                    >
                      <p className="whitespace-pre-wrap text-foreground">
                        {r.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Image
                          src={avatarSrc}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover border border-border flex-shrink-0"
                          unoptimized
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes("robohash.org")) {
                              target.src = `https://robohash.org/${encodeURIComponent(r.userId)}?set=set1&size=80x80`;
                            }
                          }}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {displayName}
                        </span>
                        {r.userEmail && (
                          <span className="text-xs text-muted-foreground">
                            {r.userEmail}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
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
                disabled={createReply.isPending}
                className="min-h-[100px] rounded-xl resize-none"
              />
              <Button
                type="submit"
                disabled={createReply.isPending || !replyBody.trim()}
                className="gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/60 to-violet-500/40 text-white shadow-[0_10px_30px_rgba(139,92,246,0.25)] hover:from-violet-500/70 hover:to-violet-500/50"
              >
                {createReply.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-sm",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
            <CardDescription>
              Admin-only notes. Not visible to the ticket creator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Add internal notes..."
              value={notesValue}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesTouched(true);
              }}
              disabled={isUpdating}
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

        <Card
          className={cn(
            "rounded-[20px] border backdrop-blur-sm",
            variantConfig.border,
            variantConfig.gradient,
            variantConfig.shadow,
          )}
        >
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this support ticket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Ticket"}
                </Button>
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
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </PageContentWrapper>
  );
}
