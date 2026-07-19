/**
 * REQ-0155 — Shared Total Orders KPI badges (store-wide).
 * Shipping = processing + shipped; Delivered is separate.
 * Client-safe / pure.
 */

export type StoreOrderStatusDistInput = {
  pending?: number;
  confirmed?: number;
  processing?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
};

export type StoreOrderStatusBadge = {
  label: string;
  value: number;
};

export type BuildStoreOrderStatusBadgesInput = {
  statusDistribution?: StoreOrderStatusDistInput | null;
  refundedCount?: number;
  selfOthers?: {
    orderSelfCount: number;
    orderOthersCount: number;
  } | null;
};

function n(value: number | undefined): number {
  const v = Number(value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

/**
 * Pending → Confirmed → Shipping → Delivered → Refund → Cancel (+ Self/Others).
 */
export function buildStoreOrderStatusBadges(
  input: BuildStoreOrderStatusBadgesInput,
): StoreOrderStatusBadge[] {
  const d = input.statusDistribution ?? {};
  const badges: StoreOrderStatusBadge[] = [
    { label: "Pending", value: n(d.pending) },
    { label: "Confirmed", value: n(d.confirmed) },
    { label: "Shipping", value: n(d.processing) + n(d.shipped) },
    { label: "Delivered", value: n(d.delivered) },
    { label: "Refund", value: n(input.refundedCount) },
    { label: "Cancel", value: n(d.cancelled) },
  ];

  if (input.selfOthers) {
    badges.push(
      { label: "Self", value: n(input.selfOthers.orderSelfCount) },
      { label: "Others", value: n(input.selfOthers.orderOthersCount) },
    );
  }

  return badges;
}
