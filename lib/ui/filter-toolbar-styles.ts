/**
 * REQ-0046 — list filter toolbar search inputs (no focus border shift; hue ring in dark).
 */
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
} from "@/lib/ui/focus-ring-styles";

const FILTER_SEARCH_SHELL = `${FOCUS_NO_LAYOUT_SHIFT_CLASS} h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40`;

export const FILTER_SEARCH_INPUT_SKY_CLASS = `${FILTER_SEARCH_SHELL} ${GLASS_FOCUS_RING.sky} border border-sky-400/30 dark:border-white/20 shadow-[0_10px_30px_rgba(2,132,199,0.15)]`;

export const FILTER_SEARCH_INPUT_TEAL_CLASS = `${FILTER_SEARCH_SHELL} ${GLASS_FOCUS_RING.teal} border border-teal-400/30 dark:border-white/20 shadow-[0_10px_30px_rgba(20,184,166,0.15)]`;
