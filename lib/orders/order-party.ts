/**
 * REQ-0158 — Canonical order/invoice party semantics.
 *
 * - `userId` = store / catalog owner (seller side)
 * - `clientId` = buyer; `null` = owner self-order
 * - `createdBy` = session actor who created the row (not used for Self/Others)
 *
 * Self = no other buyer (`!clientId` or `clientId === userId`).
 * Client/Others = distinct buyer (`clientId` set and ≠ owner).
 */

export type OrderPartyFields = {
  userId: string;
  clientId?: string | null;
};

/** Owner self-order (no separate client buyer). */
export function isSelfOrder(order: OrderPartyFields): boolean {
  const buyer = order.clientId ?? null;
  return buyer == null || buyer === "" || buyer === order.userId;
}

/** Store order purchased by a distinct client. */
export function isClientBuyerOrder(order: OrderPartyFields): boolean {
  const buyer = order.clientId ?? null;
  return buyer != null && buyer !== "" && buyer !== order.userId;
}

/**
 * Resolve store owner from product `userId`s on line items.
 * Majority vote; ties → first id in input order.
 */
export function resolveStoreOwnerUserId(
  productOwnerUserIds: readonly string[],
): string | null {
  const ids = productOwnerUserIds.filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) return null;

  const counts = new Map<string, number>();
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  let bestId = ids[0]!;
  let bestCount = 0;
  for (const id of ids) {
    const c = counts.get(id) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      bestId = id;
    }
  }
  return bestId;
}

/** Buyer display id: client when present, else owner (self). */
export function resolveBuyerUserId(order: OrderPartyFields): string {
  if (isClientBuyerOrder(order) && order.clientId) {
    return order.clientId;
  }
  return order.userId;
}

/** Minimal user row for buyer/store labels (SSR + list transforms). */
export type PartyUserRow = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type BuyerDisplay = {
  userId: string;
  name: string | null;
  email: string | null;
};

/**
 * REQ-0159 — Resolve buyer display from a user map keyed by user id.
 * Self → owner; Client → distinct `clientId` user.
 */
export function resolveBuyerDisplayFromUsers(
  order: OrderPartyFields,
  userMap: ReadonlyMap<string, PartyUserRow>,
): BuyerDisplay {
  const buyerId = resolveBuyerUserId(order);
  const u = userMap.get(buyerId);
  return {
    userId: buyerId,
    name: u?.name ?? u?.email ?? null,
    email: u?.email ?? null,
  };
}

/** Client list meta: store owner must not read as the customer. */
export function formatStoreOwnerLabel(
  name: string | null | undefined,
  email?: string | null,
): string {
  const primary = (name && name.trim()) || (email && email.trim()) || "Store";
  return `Store · ${primary}`;
}
