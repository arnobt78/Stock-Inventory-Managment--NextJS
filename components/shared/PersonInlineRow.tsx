"use client";

/**
 * REQ-0127 — inline avatar + sky name link + muted copyable email (detail/audit/party rows).
 */

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
  /** REQ-0164 — passed to AvatarInlineLink (self gray vs sky) */
  linkClassName?: string;
  avatarSize?: number;
  className?: string;
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
}: PersonInlineRowProps) {
  const showEmail = Boolean(email && name && email !== name);

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 min-h-7 font-normal",
        className,
      )}
    >
      <AvatarInlineLink
        seed={seed}
        image={image}
        label={name}
        href={href}
        linkClassName={linkClassName}
        size={avatarSize}
      />
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
  );
}
