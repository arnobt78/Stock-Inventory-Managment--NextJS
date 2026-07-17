/**
 * REQ-0043 — shared borderless filter chip row styles (catalog + multi-select lists).
 * X dismiss hover: rose; Reset hover: sky.
 */
import { cn } from "@/lib/utils";

export const FILTER_CHIP_ROW_CLASS =
  "flex flex-wrap items-center gap-2 poppins";

export const FILTER_CHIP_GROUP_LABEL_CLASS =
  "text-xs text-gray-600 dark:text-white/80";

export const FILTER_CHIP_DISMISS_BTN_CLASS = cn(
  "inline-flex items-center gap-1 rounded-full pr-1.5 transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
  "hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10",
);

export const FILTER_CHIP_RESET_BTN_CLASS = cn(
  "h-8 gap-1.5 px-2 text-xs text-gray-700 dark:text-white/80",
  "hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-500/15",
);

export const FILTER_CHIP_COLLAPSED_CLASS =
  "inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-gray-700 dark:text-white/80 backdrop-blur-md";
