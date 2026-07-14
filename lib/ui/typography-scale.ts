/**
 * REQ-0044 — shared responsive typography tiers (page header, card title, subtitle, stat value).
 * Use TYPO_STAT_VALUE only for metric numbers — not section titles.
 */

/** Page/list h1–h2 (PageSectionHeader, list page titles) */
export const TYPO_PAGE_HEADER =
  "text-sm sm:text-lg font-medium leading-tight text-gray-700 dark:text-white";

/** Card/section h3, dialog titles */
export const TYPO_CARD_TITLE =
  "text-sm sm:text-base font-medium leading-tight text-gray-700 dark:text-white";

/** Subtitle, description, muted body */
export const TYPO_SUBTITLE =
  "text-xs sm:text-sm leading-tight text-gray-600 dark:text-white/70";

/** Metric/stat primary value — do not use on titles */
export const TYPO_STAT_VALUE =
  "text-sm sm:text-lg font-medium text-gray-700 dark:text-white";

/** REQ-0116 — detail page data values (font-normal; section titles stay TYPO_CARD_TITLE) */
export const DETAIL_DATA_VALUE_CLASS =
  "font-normal text-gray-700 dark:text-white";

const detailStatValueTones = {
  sky: "font-normal text-sky-600 dark:text-sky-400",
  emerald: "font-normal text-emerald-600 dark:text-emerald-400",
  amber: "font-normal text-amber-600 dark:text-amber-400",
  rose: "font-normal text-rose-600 dark:text-rose-400",
  violet: "font-normal text-violet-600 dark:text-violet-400",
} as const;

export type DetailStatValueTone = keyof typeof detailStatValueTones;

/** Semantic hue for detail stat card metric values */
export function detailStatValueToneClass(tone: DetailStatValueTone): string {
  return detailStatValueTones[tone];
}

/** REQ-0064 — default body text color (use when no explicit tone is set) */
export const TYPO_BODY = "text-gray-700 dark:text-white";

/** REQ-0064 — muted body text color (secondary copy, meta labels) */
export const TYPO_BODY_MUTED = "text-gray-600 dark:text-gray-400";
