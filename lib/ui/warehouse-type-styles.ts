/**
 * REQ-0128 — shared warehouse type icon + badge tone map (DRY with WarehouseTypeBadge).
 * Glass glow surfaces (parity with ActiveInactiveBadge / order status chips).
 * REQ-0186 — WAREHOUSE_TYPE_OPTIONS + getWarehouseTypeLabel for table/detail/dialog badges.
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

/** Dialog Select options — values must match WAREHOUSE_TYPE_TONES keys. */
export const WAREHOUSE_TYPE_OPTIONS = [
  { value: "main", label: "Main Warehouse" },
  { value: "secondary", label: "Secondary" },
  { value: "storage", label: "Storage" },
  { value: "distribution", label: "Distribution Center" },
  { value: "retail", label: "Retail Store" },
  { value: "other", label: "Other" },
] as const;

function normalizeWarehouseTypeKey(value: string): string {
  return (value || "").toLowerCase().replace(/\s+/g, "_");
}

/** Title-case fallback for unknown free-text types (avoids importing semantic-badges). */
function titleCaseTypeLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * REQ-0186 — human label for badges (e.g. main → "Main Warehouse").
 * Unknown keys fall back to title-case of the raw value.
 */
export function getWarehouseTypeLabel(type?: string | null): string {
  const trimmed = (type || "").trim();
  if (!trimmed) return "—";
  const key = normalizeWarehouseTypeKey(trimmed);
  const match = WAREHOUSE_TYPE_OPTIONS.find((opt) => opt.value === key);
  return match?.label ?? titleCaseTypeLabel(trimmed);
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
