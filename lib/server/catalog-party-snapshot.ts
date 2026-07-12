/**
 * REQ-0086 — map Prisma user row to catalog detail party snapshot (category + supplier SSR).
 */

import type { CatalogDetailPartySnapshot } from "@/types/catalog-detail-lists";

export type CatalogPartyUserRow = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
};

/** Normalize user select row for detail list avatars (owner, buyer). */
export function toParty(
  user: CatalogPartyUserRow | null | undefined,
): CatalogDetailPartySnapshot | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image ?? null,
  };
}
