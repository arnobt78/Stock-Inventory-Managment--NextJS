"use client";

import React, { useState, useLayoutEffect } from "react";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper } from "@/components/shared";
import {
  useSupportTicket,
  useSupportTicketReplies,
  useCreateSupportTicketReply,
} from "@/hooks/queries";
import { isDataSlotLoading, queryKeys } from "@/lib/react-query";
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Loader2,
  User,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from "@/lib/ui/semantic-badges";
import type { SupportTicket, SupportTicketReply } from "@/types";

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
  /** SSR replies for first paint (REQ-0025 P2) */
  initialReplies?: SupportTicketReply[];
};

export default function SupportTicketDetailContent({
  initialTicket,
  initialReplies,
}: SupportTicketDetailContentProps) {
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const { data: ticket = initialTicket } = useSupportTicket(initialTicket.id);

  useLayoutEffect(() => {
    queryClient.setQueryData(
      queryKeys.supportTickets.detail(initialTicket.id),
      initialTicket,
    );
  }, [queryClient, initialTicket]);
  const repliesQuery = useSupportTicketReplies(ticket.id, initialReplies);
  const replies = repliesQuery.data ?? initialReplies ?? [];
  const repliesLoading = isDataSlotLoading(repliesQuery, initialReplies);
  const createReply = useCreateSupportTicketReply(ticket.id);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    createReply.mutate(
      { body: replyBody.trim() },
      {
        onSuccess: () => setReplyBody(""),
      },
    );
  };

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="space-y-4 poppins">
          <div className="flex items-center gap-2">
            <Link
              href="/support-tickets"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-sky-400/30 dark:border-sky-400/30",
                "bg-white/60 dark:bg-white/5 backdrop-blur-md",
                "hover:bg-white/80 dark:hover:bg-white/10",
                "text-gray-700 dark:text-gray-300 text-sm font-medium px-2 py-2",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to tickets
            </Link>
          </div>

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
                {ticket.ticketNumber && (
                  <p className="text-xs font-mono text-sky-600 dark:text-sky-400 mb-1">
                    {ticket.ticketNumber}
                  </p>
                )}
                <h1 className="text-sm sm:text-lg font-medium text-gray-700 dark:text-white">
                  {ticket.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <TicketStatusBadge status={ticket.status} size="detail" />
                  <TicketPriorityBadge status={ticket.priority} size="detail" />
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {format(
                      new Date(ticket.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </span>
                </div>
                {(ticket.creatorName || ticket.creatorEmail) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Creator:
                    </span>
                    {ticket.creatorName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {ticket.creatorName}
                      </span>
                    )}
                    {ticket.creatorEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {ticket.creatorEmail}
                      </span>
                    )}
                  </div>
                )}
                {(ticket.assignedToName || ticket.assignedToEmail) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Sent to:
                    </span>
                    {ticket.assignedToName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {ticket.assignedToName}
                      </span>
                    )}
                    {ticket.assignedToEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {ticket.assignedToEmail}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-white/40 dark:bg-white/5 border border-sky-200/30 dark:border-white/10 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </article>

          <section
            className={cn(
              "rounded-[20px] border p-2 sm:p-4 backdrop-blur-md",
              "bg-white/60 dark:bg-white/5",
              variantConfig.border,
              variantConfig.gradient,
              variantConfig.shadow,
            )}
          >
            <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white mb-4">
              Replies
            </h2>
            {repliesLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-gray-200/50 dark:bg-white/10 animate-pulse" />
                <div className="h-16 rounded-xl bg-gray-200/50 dark:bg-white/10 animate-pulse" />
              </div>
            ) : replies.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-500 py-4">
                No replies yet. Add a reply below.
              </p>
            ) : (
              <ul className="space-y-2 mb-6">
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
                      className={cn(
                        "rounded-xl border border-sky-200/40 dark:border-white/10 p-4",
                        "bg-white/50 dark:bg-white/5",
                      )}
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                        {r.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <SafeAvatarImage
                          src={avatar.src}
                          fallbackSrc={avatar.fallbackSrc}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover border border-sky-200/90 dark:border-white/30 flex-shrink-0"
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {displayName}
                        </span>
                        {r.userEmail && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {r.userEmail}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-500">
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
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                disabled={createReply.isPending}
                className="min-h-[100px] rounded-xl border-sky-400/30 dark:border-white/20 bg-white/80 dark:bg-white/5 text-gray-700 dark:text-white placeholder:text-gray-500 resize-none"
              />
              <Button
                type="submit"
                disabled={createReply.isPending || !replyBody.trim()}
                className={cn(
                  "rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/60 to-sky-500/40 text-white gap-2",
                  "shadow-[0_10px_30px_rgba(2,132,199,0.25)]",
                  "hover:from-sky-500/70 hover:to-sky-500/50",
                )}
              >
                {createReply.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2 inline-block" />
                    Send Reply
                  </>
                )}
              </Button>
            </form>
          </section>
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
