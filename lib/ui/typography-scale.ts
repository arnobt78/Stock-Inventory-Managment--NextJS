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

/** REQ-0064 — default body text color (use when no explicit tone is set) */
export const TYPO_BODY = "text-gray-700 dark:text-white";

/** REQ-0064 — muted body text color (secondary copy, meta labels) */
export const TYPO_BODY_MUTED = "text-gray-600 dark:text-gray-400";
