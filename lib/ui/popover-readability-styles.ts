/**
 * REQ-0118 — readable popover/select surfaces (light + dark) shared across dialogs, filters, pagination.
 */

import { cn } from "@/lib/utils";

export const READABLE_POPOVER_CONTENT_CLASS =
  "z-[100] bg-popover text-popover-foreground border-border shadow-md";

export const READABLE_POPOVER_ITEM_CLASS =
  "cursor-pointer text-popover-foreground focus:bg-accent focus:text-accent-foreground";

/** REQ-0117 aliases — keep imports stable */
export const DIALOG_SELECT_CONTENT_CLASS = READABLE_POPOVER_CONTENT_CLASS;
export const DIALOG_SELECT_ITEM_CLASS = READABLE_POPOVER_ITEM_CLASS;

export type PopoverHue =
  | "sky"
  | "violet"
  | "rose"
  | "teal"
  | "amber"
  | "emerald"
  | "cyan";

const HUE_BORDER: Record<PopoverHue, string> = {
  sky: "border-sky-400/20",
  violet: "border-violet-400/20",
  rose: "border-rose-400/20",
  teal: "border-teal-400/20",
  amber: "border-amber-400/20",
  emerald: "border-emerald-400/20",
  cyan: "border-cyan-400/20",
};

const HUE_SHADOW: Record<PopoverHue, string> = {
  sky: "shadow-[0_10px_30px_rgba(2,132,199,0.15)]",
  violet: "shadow-[0_10px_30px_rgba(139,92,246,0.15)]",
  rose: "shadow-[0_10px_30px_rgba(225,29,72,0.15)]",
  teal: "shadow-[0_10px_30px_rgba(20,184,166,0.15)]",
  amber: "shadow-[0_10px_30px_rgba(245,158,11,0.15)]",
  emerald: "shadow-[0_10px_30px_rgba(16,185,129,0.15)]",
  cyan: "shadow-[0_10px_30px_rgba(6,182,212,0.15)]",
};

export type CatalogEntityPopover = "category" | "supplier" | "warehouse";

const CATALOG_ENTITY_HUE: Record<CatalogEntityPopover, PopoverHue> = {
  category: "sky",
  supplier: "emerald",
  warehouse: "cyan",
};

export type ExportMenuPopoverAccent = "violet" | "teal";

/** Catalog Active/Inactive Select dropdown shell (REQ-0119). */
export function catalogEntityPopoverContentClass(
  entity: CatalogEntityPopover,
): string {
  return paginationPopoverContentClass(CATALOG_ENTITY_HUE[entity]);
}

/** Export menu dropdown shell (REQ-0119). */
export function exportMenuPopoverContentClass(
  accent: ExportMenuPopoverAccent,
): string {
  return paginationPopoverContentClass(accent);
}

/** Command filter popover shell — readable popover + domain hue accent */
export function filterCommandPopoverClass(
  hue: PopoverHue,
  ...extra: (string | undefined)[]
): string {
  return cn(
    "rounded-[28px] dark:border-white/10",
    HUE_BORDER[hue],
    READABLE_POPOVER_CONTENT_CLASS,
    HUE_SHADOW[hue],
    ...extra,
  );
}

/** Pagination / compact select dropdown shell */
export function paginationPopoverContentClass(hue: PopoverHue): string {
  return cn(
    "rounded-[28px] dark:border-white/10",
    HUE_BORDER[hue],
    READABLE_POPOVER_CONTENT_CLASS,
    HUE_SHADOW[hue],
  );
}

/** cmdk search input row inside filter popovers */
export const FILTER_COMMAND_INPUT_WRAPPER_CLASS =
  "[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border [&_[cmdk-input-wrapper]]:bg-muted/30";
