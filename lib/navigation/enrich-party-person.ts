/**
 * REQ-0164 — attach owner-products href + self name tone for Parties & Roles rows.
 * Pure helper (no React); safe for client party cards.
 */

import {
  PARTY_SELF_LINK_CLASS,
  resolveOwnerProductsHref,
} from "@/lib/navigation/owner-products-href";

export type EnrichedPartyPerson = {
  userId?: string;
  name?: string | null;
  email: string;
  image?: string | null;
  href?: string;
  linkClassName?: string;
};

export function enrichPartyPerson(
  person:
    | {
        userId?: string;
        name?: string | null;
        email: string;
        image?: string | null;
      }
    | null
    | undefined,
  options: { isAdminRole: boolean; viewerUserId?: string | null },
): EnrichedPartyPerson | null {
  if (!person) return null;
  const href = person.userId
    ? resolveOwnerProductsHref(person.userId, options.isAdminRole)
    : undefined;
  const isSelf =
    Boolean(person.userId) &&
    Boolean(options.viewerUserId) &&
    person.userId === options.viewerUserId;

  return {
    userId: person.userId,
    name: person.name,
    email: person.email,
    image: person.image,
    href,
    linkClassName: isSelf ? PARTY_SELF_LINK_CLASS : undefined,
  };
}
