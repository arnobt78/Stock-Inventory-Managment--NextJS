/**
 * REQ-0197 — When Send-to changes, clear productId if linked product is not owned
 * by the new assignee (Related card must stay coherent).
 */

export type TicketProductOwnerSnap = {
  productId: string | null | undefined;
  productOwnerUserId: string | null | undefined;
};

/**
 * Returns productId to write on update: keep when owner matches next assignee;
 * clear (null) when missing assignee, missing product owner, or mismatch;
 * undefined when no product linked (leave field alone).
 */
export function resolveProductIdAfterAssigneeChange(
  snap: TicketProductOwnerSnap,
  nextAssignedToId: string | null,
): string | null | undefined {
  if (!snap.productId) return undefined;
  if (!nextAssignedToId) return null;
  if (!snap.productOwnerUserId) return null;
  if (snap.productOwnerUserId !== nextAssignedToId) return null;
  return snap.productId;
}

/** Whether confirm copy should warn that Related product will be cleared. */
export function willClearProductOnReassign(
  snap: TicketProductOwnerSnap,
  nextAssignedToId: string | null,
): boolean {
  const next = resolveProductIdAfterAssigneeChange(snap, nextAssignedToId);
  return next === null && !!snap.productId;
}
