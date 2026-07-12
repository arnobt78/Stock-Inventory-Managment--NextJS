"use client";

import Link from "next/link";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";
import { cn } from "@/lib/utils";

export type AvatarInlineLinkProps = {
  /** Display name beside avatar */
  label: string;
  /** Robohash / avatar seed (user id or supplier id) */
  seed: string;
  /** Optional Google profile image */
  image?: string | null;
  /** When set, name is a link */
  href?: string;
  size?: number;
  className?: string;
  linkClassName?: string;
};

/** REQ-0077 — round avatar + optional link for owner/supplier/buyer rows */
export function AvatarInlineLink({
  label,
  seed,
  image,
  href,
  size = 24,
  className,
  linkClassName,
}: AvatarInlineLinkProps) {
  const avatar = resolveAvatarSourcesFromSeed(seed, image ?? null);
  const nameEl = href ? (
    <Link
      href={href}
      className={cn(
        "font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate",
        linkClassName,
      )}
    >
      {label}
    </Link>
  ) : (
    <span className={cn("font-medium truncate", linkClassName)}>{label}</span>
  );

  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          AVATAR_RING_CLASS,
        )}
        style={{ width: size, height: size }}
      >
        <SafeAvatarImage
          src={avatar.src}
          fallbackSrc={avatar.fallbackSrc}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
      {nameEl}
    </span>
  );
}
