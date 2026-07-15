"use client";

/**
 * REQ-0095 — merged audit user row for catalog detail pages.
 * REQ-0126 — sky CopyableText email; vertical-friendly inline alignment.
 */

import type { LucideIcon } from "lucide-react";
import { User } from "lucide-react";
import {
  AvatarInlineLink,
  CopyableText,
} from "@/components/shared";
import {
  DetailInfoRow,
  type CardVariant,
} from "@/components/orders/detail";

export type AuditUserDetail = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
};

export type AuditUserDetailRowProps = {
  label: string;
  icon?: LucideIcon;
  tone?: CardVariant;
  user?: AuditUserDetail | null;
  /** Admin user-management link; omit for client/supplier roles */
  href?: string;
  loading?: boolean;
};

export function AuditUserDetailRow({
  label,
  icon = User,
  tone = "violet",
  user,
  href,
  loading,
}: AuditUserDetailRowProps) {
  if (!loading && !user) return null;

  return (
    <DetailInfoRow icon={icon} label={label} tone={tone} loading={loading}>
      {user ? (
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 font-normal">
          <AvatarInlineLink
            seed={user.id}
            image={user.image}
            label={user.name ?? user.email}
            href={href}
            size={24}
            linkClassName="text-gray-700 dark:text-white hover:text-sky-600 dark:hover:text-sky-400"
          />
          <CopyableText
            value={user.email}
            className="text-sm text-sky-600 dark:text-sky-400 font-normal"
          >
            {user.email}
          </CopyableText>
        </span>
      ) : null}
    </DetailInfoRow>
  );
}
