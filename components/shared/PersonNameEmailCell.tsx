"use client";

/**
 * REQ-0185 — supplier-style table person cell:
 * avatar | sky name (optional Link) | muted email + CopyableText clipboard.
 * Never nest CopyableText inside the name button/link.
 */

import Link from "next/link";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { CopyableText } from "@/components/shared/CopyableText";
import { TABLE_CATALOG_LINK_CLASS } from "@/components/shared";
import { cn } from "@/lib/utils";

export type PersonNameEmailCellProps = {
  seed: string;
  name: string;
  email?: string | null;
  image?: string | null;
  /** When set, name is a sky Link; omit for plain text name. */
  href?: string;
  avatarSize?: number;
  className?: string;
  linkClassName?: string;
};

export function PersonNameEmailCell({
  seed,
  name,
  email,
  image,
  href,
  avatarSize = 28,
  className,
  linkClassName = TABLE_CATALOG_LINK_CLASS,
}: PersonNameEmailCellProps) {
  const emailTrimmed = email?.trim() || null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0 max-w-[220px]",
        className,
      )}
    >
      <AvatarInlineLink
        seed={seed}
        image={image}
        size={avatarSize}
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-col">
        {href ? (
          <Link
            href={href}
            className={cn(linkClassName, "truncate max-w-full")}
            title={name}
          >
            {name}
          </Link>
        ) : (
          <span
            className="truncate text-sm text-gray-800 dark:text-white"
            title={name}
          >
            {name}
          </span>
        )}
        {emailTrimmed ? (
          <CopyableText
            value={emailTrimmed}
            className="truncate text-xs font-normal text-muted-foreground"
          >
            {emailTrimmed}
          </CopyableText>
        ) : null}
      </div>
    </div>
  );
}
