"use client";

/**
 * REQ-0127 — inline avatar + sky name link + muted copyable email (detail/audit/party rows).
 * REQ-0208 — layout: [avatar] | name · email / User ID (start-aligned under name).
 */

import Link from "next/link";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import { TYPO_BODY_MUTED } from "@/lib/ui/typography-scale";
import { cn } from "@/lib/utils";

export type PersonInlineRowProps = {
  seed: string;
  name: string;
  email?: string | null;
  image?: string | null;
  href?: string;
  /** Optional name link class override; omit for default sky */
  linkClassName?: string;
  avatarSize?: number;
  className?: string;
  /** REQ-0208 — mono User ID under name/email, start-aligned with text column */
  userId?: string | null;
};

export function PersonInlineRow({
  seed,
  name,
  email,
  image,
  href,
  linkClassName,
  avatarSize = 24,
  className,
  userId,
}: PersonInlineRowProps) {
  const showEmail = Boolean(email && name && email !== name);
  const showUserId = Boolean(userId && userId.trim());

  const nameEl = href ? (
    <Link
      href={href}
      className={cn(
        "text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate",
        linkClassName,
      )}
    >
      {name}
    </Link>
  ) : (
    <span className={cn("text-sm font-normal truncate", linkClassName)}>
      {name}
    </span>
  );

  return (
    <span
      className={cn(
        "inline-flex items-start gap-x-1.5 min-w-0 min-h-7 font-normal",
        className,
      )}
    >
      {/* Avatar only — name lives in the text column for User ID alignment */}
      <AvatarInlineLink
        seed={seed}
        image={image}
        size={avatarSize}
        className="shrink-0"
      />
      <span className="inline-flex flex-col items-start gap-y-0.5 min-w-0">
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 min-h-5">
          {nameEl}
          {showEmail ? (
            <>
              <span className={cn("text-xs", TYPO_BODY_MUTED)} aria-hidden>
                ·
              </span>
              <CopyableText
                value={email!}
                className={cn("text-sm font-normal", TYPO_BODY_MUTED)}
              >
                {email}
              </CopyableText>
            </>
          ) : null}
        </span>
        {/* Stable height when User ID present — reduces detail-card expand flash */}
        {showUserId ? (
          <span className="inline-flex flex-wrap items-center gap-x-1.5 min-w-0 w-full max-w-full min-h-[1.125rem]">
            <span className={cn("text-xs shrink-0", TYPO_BODY_MUTED)}>
              User ID:
            </span>
            {/* truncate (not break-all) — avoids letter-wrap flash in narrow cards */}
            <CopyableText
              value={userId!}
              className={cn(
                "font-mono text-xs font-normal min-w-0 max-w-full truncate",
                TYPO_BODY_MUTED,
              )}
            >
              <span className="truncate" title={userId ?? undefined}>
                {userId}
              </span>
            </CopyableText>
          </span>
        ) : null}
      </span>
    </span>
  );
}
