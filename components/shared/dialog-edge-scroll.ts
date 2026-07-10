/**
 * Edge-aligned vertical scrollbar layout for large dialogs (same as PaymentDialog).
 * Shell uses pr-0 so the scrollbar sits on the dialog border; inner content keeps pr-* inset.
 */

/** DialogContent base — pair with feature-specific border/shadow classes */
export const DIALOG_EDGE_SCROLL_SHELL =
  "flex max-h-[90vh] flex-col overflow-hidden min-w-0 pl-4 sm:pl-8 pt-4 sm:pt-7 pb-4 sm:pb-7 pr-0";

/** DialogHeader — inset content, not the scroll track */
export const DIALOG_EDGE_SCROLL_HEADER = "flex-shrink-0 .5 pr-4 sm:pr-8";

/** Full-width scroll region; y-scrollbar flush to the shell right edge (no overflow-x-hidden — avoids clipping input/table shadows) */
export const DIALOG_EDGE_SCROLL_BODY =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto w-full";

/** Padded content inside the scroll region */
/** pl-2 gives rose input shadow room on the left inside the scroll area */
export const DIALOG_EDGE_SCROLL_INNER = "flex flex-col pr-4 sm:pr-8 pl-2 pb-4";

/** Wrapper around dialog embedded list tables */
export const DIALOG_TABLE_SECTION = "mt-6 min-w-0";

/**
 * Table frame for category dialog — ring + shadow-sm only (large box-shadow clips inside overflow).
 */
export const DIALOG_TABLE_FRAME_SKY =
  "rounded-md border border-white/10 bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md ring-1 ring-sky-400/25 shadow-sm";

/**
 * Table frame for supplier dialog — ring + shadow-sm only (large box-shadow clips inside overflow).
 */
export const DIALOG_TABLE_FRAME_EMERALD =
  "rounded-md border border-white/10 bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md ring-1 ring-emerald-400/25 shadow-sm";

/**
 * REQ-0048 — embedded dialog tables (dark glass shell; light system theme).
 * Use td-level zebra so horizontal scroll does not break striping.
 */
export const DIALOG_TABLE_TEXT = "text-white/90";
export const DIALOG_TABLE_TEXT_MUTED = "text-white/70";
export const DIALOG_TABLE_HEAD_TEXT = "text-white/80";
export const DIALOG_TABLE_HEAD_ROW = "[&_th]:bg-white/10";
export const DIALOG_TABLE_ROW_EVEN = "[&_td]:bg-white/10";
export const DIALOG_TABLE_ROW_ODD = "[&_td]:bg-white/[0.06]";
export const DIALOG_TABLE_ROW_HOVER = "hover:[&_td]:bg-white/15";
export const DIALOG_TABLE_SURFACE = "bg-black/20";
