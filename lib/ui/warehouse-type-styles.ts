/**
 * REQ-0128 — shared warehouse type icon + badge tone map (DRY with WarehouseTypeBadge).
 * Glass glow surfaces (parity with ActiveInactiveBadge / order status chips).
 */

import {
  Building,
  Building2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { GLASS_BADGE_CLASS } from "@/lib/ui/glass-badge-styles";

export type WarehouseTypeTone = {
  className: string;
  icon: LucideIcon;
};

function normalizeWarehouseTypeKey(value: string): string {
  return (value || "").toLowerCase().replace(/\s+/g, "_");
}

/** Meaningful hue per warehouse role — glass glow (not opaque flat chips). */
export const WAREHOUSE_TYPE_TONES: Record<string, WarehouseTypeTone> = {
  main: { className: GLASS_BADGE_CLASS.sky, icon: Building },
  secondary: { className: GLASS_BADGE_CLASS.teal, icon: Building2 },
  storage: { className: GLASS_BADGE_CLASS.amber, icon: Building2 },
  distribution: { className: GLASS_BADGE_CLASS.violet, icon: Truck },
  retail: { className: GLASS_BADGE_CLASS.cyan, icon: Building },
  other: { className: GLASS_BADGE_CLASS.slate, icon: Building },
};

const DEFAULT_WAREHOUSE_TYPE_TONE: WarehouseTypeTone = {
  className: GLASS_BADGE_CLASS.slate,
  icon: Building2,
};

export function getWarehouseTypeTone(
  type?: string | null,
): WarehouseTypeTone {
  if (!type) return DEFAULT_WAREHOUSE_TYPE_TONE;
  const key = normalizeWarehouseTypeKey(type);
  return WAREHOUSE_TYPE_TONES[key] ?? DEFAULT_WAREHOUSE_TYPE_TONE;
}

export function getWarehouseTypeIcon(type?: string | null): LucideIcon {
  return getWarehouseTypeTone(type).icon;
}
