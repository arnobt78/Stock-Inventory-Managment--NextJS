/**
 * REQ-0128 — shared warehouse type icon + badge tone map (DRY with WarehouseTypeBadge).
 */

import {
  Building,
  Building2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { OPAQUE_BADGE_CLASS } from "@/lib/ui/glass-badge-styles";

export type WarehouseTypeTone = {
  className: string;
  icon: LucideIcon;
};

function normalizeWarehouseTypeKey(value: string): string {
  return (value || "").toLowerCase().replace(/\s+/g, "_");
}

export const WAREHOUSE_TYPE_TONES: Record<string, WarehouseTypeTone> = {
  main: { className: OPAQUE_BADGE_CLASS.blue, icon: Building },
  secondary: { className: OPAQUE_BADGE_CLASS.teal, icon: Building2 },
  storage: { className: OPAQUE_BADGE_CLASS.amber, icon: Building2 },
  distribution: { className: OPAQUE_BADGE_CLASS.violet, icon: Truck },
  retail: { className: OPAQUE_BADGE_CLASS.sky, icon: Building },
  other: { className: OPAQUE_BADGE_CLASS.gray, icon: Building },
};

const DEFAULT_WAREHOUSE_TYPE_TONE: WarehouseTypeTone = {
  className: OPAQUE_BADGE_CLASS.gray,
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
