"use client";

/**
 * REQ-0095 — merged audit user row for catalog detail pages.
 * REQ-0127 — PersonInlineRow: sky name · muted email, vertically centered.
 * REQ-0221 — densify-first: pass `loading={dataLoading && !user}` so SSR/cache
 * creator/updater paint immediately (do not gate the whole row on dataLoading).
 */

import type { LucideIcon } from "lucide-react";
import { User } from "lucide-react";
import {
  DetailInfoRow,
  type CardVariant,
} from "@/components/orders/detail";
import { PersonInlineRow } from "@/components/shared/PersonInlineRow";

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
        <PersonInlineRow
          seed={user.id}
          image={user.image}
          name={user.name ?? user.email}
          email={user.email}
          href={href}
        />
      ) : null}
    </DetailInfoRow>
  );
}
