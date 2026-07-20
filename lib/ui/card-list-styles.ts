/**
 * Shared card list row styles — matches Top Products by Orders table dividers.
 * REQ-0174 — clip-safe meta rows for AvatarInlineLink rings.
 */

/** List wrapper with row separators */
export const CARD_LIST_DIVIDE_CLASS =
  "divide-y divide-border dark:divide-white/10";

/** Standard padded row inside card lists (px-2.5 leaves room for avatar ring-offset) */
export const CARD_LIST_ROW_CLASS =
  "flex items-center justify-between gap-2 py-2 px-2.5 overflow-visible";

/** Secondary meta line under primary link (plain text — truncate OK) */
export const CARD_LIST_META_CLASS =
  "text-xs text-gray-700 dark:text-white/80 truncate block";

/**
 * Flex meta row with avatars/icons — no truncate/overflow-hidden
 * (those clip AvatarInlineLink ring-offset on the left edge).
 */
export const CARD_LIST_META_ROW_CLASS =
  "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 text-xs text-gray-700 dark:text-white/80 overflow-visible";
