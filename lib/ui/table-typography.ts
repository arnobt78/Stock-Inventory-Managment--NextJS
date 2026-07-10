/**
 * Shared table cell typography (REQ-0028).
 * Defaults live in components/ui/table.tsx — TableHead text-sm, TableCell text-xs, both font-normal.
 * Non-table responsive tiers: lib/ui/typography-scale.ts (REQ-0044).
 * Use these only for semantic overrides (links, muted empty state, destructive color).
 */

/** Empty / placeholder cell */
export const TABLE_CELL_MUTED = "text-gray-500 dark:text-gray-400";

/** Primary column links (name/title) — size inherits TableCell text-xs */
export const TABLE_LINK_PRIMARY =
  "font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300";

/** Filter / toolbar trigger label */
export const FILTER_TRIGGER_LABEL =
  "text-sm font-normal text-gray-700 dark:text-white";

/** Dropdown / command menu item label */
export const MENU_ITEM_LABEL =
  "text-sm font-normal text-gray-700 dark:text-white";
