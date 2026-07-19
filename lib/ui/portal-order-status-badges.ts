/**
 * REQ-0157 — Portal Total Orders KPI badges (client/supplier fulfillment model).
 * Pending → In progress → Shipping → Delivered → [Refunded] → [Cancelled].
 * Not store Confirmed/Cancel — portals use a different status grouping.
 * Client-safe / pure.
 */

export type PortalOrderStatusBadge = {
  label: string;
  value: number;
};

export type BuildPortalOrderStatusBadgesInput = {
  pending?: number;
  inProgress?: number;
  shipped?: number;
  delivered?: number;
  /** When defined, appends Refunded (use 0 to show the badge). */
  refundedCount?: number;
  /** When defined, appends Cancelled (use 0 to show the badge). */
  cancelledCount?: number;
};

function n(value: number | undefined): number {
  const v = Number(value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

/**
 * Portal fulfillment set. Optional refunded/cancelled only when callers pass them
 * (undefined = omit badge; 0 = show zero).
 */
export function buildPortalOrderStatusBadges(
  input: BuildPortalOrderStatusBadgesInput,
): PortalOrderStatusBadge[] {
  const badges: PortalOrderStatusBadge[] = [
    { label: "Pending", value: n(input.pending) },
    { label: "In progress", value: n(input.inProgress) },
    { label: "Shipping", value: n(input.shipped) },
    { label: "Delivered", value: n(input.delivered) },
  ];

  if (input.refundedCount !== undefined) {
    badges.push({ label: "Refunded", value: n(input.refundedCount) });
  }
  if (input.cancelledCount !== undefined) {
    badges.push({ label: "Cancelled", value: n(input.cancelledCount) });
  }

  return badges;
}
