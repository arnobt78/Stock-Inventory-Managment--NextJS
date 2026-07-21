"use client";

/**
 * REQ-0191 — Chat-style ticket replies.
 * REQ-0193 — opening description as first left bubble; 90% width; title link size;
 * clickable author names via authorHrefForUserId.
 * Left = ticket creator; right = staff/others. Title: Reply to {creator} sky link.
 */

import React, { useState } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  ClientDateTime,
  CopyableText,
  DataSlotPulse,
  DialogSubmitButton,
  SectionCardHeader,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";
import { GlassCard } from "@/components/orders/detail";
import { useCreateSupportTicketReply } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { MessageSquare, Send } from "lucide-react";
import type { SupportTicket, SupportTicketReply } from "@/types";

export type SupportTicketReplyThreadProps = {
  ticket: SupportTicket;
  replies: SupportTicketReply[];
  repliesLoading?: boolean;
  /** violet = admin glass; sky = user portal */
  variant?: "violet" | "sky";
  /** Admin user-management link vs plain creator name */
  creatorHref?: string | null;
  /** REQ-0193 — resolve chat author name → profile/catalog href */
  authorHrefForUserId?: (userId: string) => string | undefined;
};

/** REQ-0193 — card-title size override so sky name matches “Reply to” */
const TITLE_CREATOR_LINK_CLASS = cn(
  TABLE_CATALOG_LINK_CLASS,
  "text-sm sm:text-base font-medium",
);

type BubbleMeta = {
  userId: string;
  name: string;
  email?: string | null;
  image?: string | null;
  createdAt: string | Date;
};

function ChatBubble({
  body,
  isCustomer,
  meta,
  authorHref,
}: {
  body: string;
  isCustomer: boolean;
  meta: BubbleMeta;
  authorHref?: string;
}) {
  const avatar = resolveAvatarSourcesFromSeed(meta.userId, meta.image);
  const nameNode = authorHref ? (
    <Link
      href={authorHref}
      className={cn(TABLE_CATALOG_LINK_CLASS, "text-xs")}
    >
      {meta.name}
    </Link>
  ) : (
    <span className={cn(TABLE_CATALOG_LINK_CLASS, "text-xs")}>{meta.name}</span>
  );

  return (
    <div
      className={cn(
        "flex w-full",
        isCustomer ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          // REQ-0193 — left/right bubbles use 90% of thread width
          "w-[90%] max-w-[90%] rounded-2xl border px-3 py-2.5 shadow-sm",
          isCustomer
            ? "rounded-tl-md bg-muted/40 border-border/60"
            : "rounded-tr-md bg-violet-500/10 dark:bg-violet-500/20 border-violet-400/25",
        )}
      >
        <p className="text-sm text-gray-700 dark:text-white whitespace-pre-wrap">
          {body}
        </p>
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs",
            isCustomer ? "justify-start" : "justify-end",
          )}
        >
          <span
            className={cn(
              "relative shrink-0 overflow-hidden rounded-full",
              AVATAR_RING_CLASS,
            )}
            style={{ width: 22, height: 22 }}
          >
            <SafeAvatarImage
              src={avatar.src}
              fallbackSrc={avatar.fallbackSrc}
              alt=""
              width={22}
              height={22}
              className="h-full w-full object-cover"
            />
          </span>
          {nameNode}
          {meta.email ? (
            <>
              <span className="text-muted-foreground">·</span>
              <CopyableText
                value={meta.email}
                className="text-xs text-muted-foreground"
              >
                {meta.email}
              </CopyableText>
            </>
          ) : null}
          <span className="text-muted-foreground">·</span>
          <ClientDateTime
            date={meta.createdAt}
            semantic="created"
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}

export default function SupportTicketReplyThread({
  ticket,
  replies,
  repliesLoading = false,
  variant = "violet",
  creatorHref,
  authorHrefForUserId,
}: SupportTicketReplyThreadProps) {
  const [replyBody, setReplyBody] = useState("");
  const createReply = useCreateSupportTicketReply(ticket.id);
  const creatorName =
    ticket.creatorName?.trim() || ticket.creatorEmail || "user";
  const openingDescription = ticket.description?.trim() ?? "";
  const hasOpening = openingDescription.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    createReply.mutate(
      { body: replyBody.trim() },
      { onSuccess: () => setReplyBody("") },
    );
  };

  const titleNode = (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      <span>Reply to</span>
      {creatorHref ? (
        <Link href={creatorHref} className={TITLE_CREATOR_LINK_CLASS}>
          {creatorName}
        </Link>
      ) : (
        <span className={TITLE_CREATOR_LINK_CLASS}>{creatorName}</span>
      )}
    </span>
  );

  const showEmpty =
    !repliesLoading && replies.length === 0 && !hasOpening;

  return (
    <GlassCard variant={variant === "violet" ? "violet" : "sky"}>
      <div className="p-2 sm:p-4 space-y-4">
        <SectionCardHeader
          title={titleNode}
          description="Send a message to the ticket creator. They will see this in the ticket thread and get a notification."
          icon={MessageSquare}
          tone={variant === "violet" ? "violet" : "sky"}
        />

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {repliesLoading && replies.length === 0 && !hasOpening ? (
            <DataSlotPulse variant="text-md" className="w-full h-16" />
          ) : showEmpty ? (
            <p className="text-sm text-muted-foreground">
              No replies yet. Be the first to respond.
            </p>
          ) : (
            <>
              {/* REQ-0193 — opening description = first left bubble (REQ-0192 message #1) */}
              {hasOpening ? (
                <ChatBubble
                  body={openingDescription}
                  isCustomer
                  meta={{
                    userId: ticket.userId,
                    name: creatorName,
                    email: ticket.creatorEmail,
                    image: ticket.creatorImage,
                    createdAt: ticket.createdAt,
                  }}
                  authorHref={
                    authorHrefForUserId?.(ticket.userId) ??
                    creatorHref ??
                    undefined
                  }
                />
              ) : null}
              {replies.map((r) => {
                const isCustomer = r.userId === ticket.userId;
                const name =
                  r.userName?.trim() || r.userEmail || r.userId.slice(-8);
                return (
                  <ChatBubble
                    key={r.id}
                    body={r.body}
                    isCustomer={isCustomer}
                    meta={{
                      userId: r.userId,
                      name,
                      email: r.userEmail,
                      image: r.userImage,
                      createdAt: r.createdAt,
                    }}
                    authorHref={authorHrefForUserId?.(r.userId)}
                  />
                );
              })}
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder={`Write a reply to ${creatorName}…`}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            disabled={createReply.isPending}
            className="min-h-[100px] rounded-xl resize-none"
          />
          <DialogSubmitButton
            isPending={createReply.isPending}
            pendingLabel="Sending…"
            label="Send Reply"
            icon={Send}
            hue={variant === "violet" ? "violet" : "sky"}
            disabled={!replyBody.trim()}
            className="h-11 rounded-xl"
          />
        </form>
      </div>
    </GlassCard>
  );
}
