/**
 * REQ-0036 — logged-in app shell width.
 * Full viewport minus horizontal padding; no max-width cap on ultrawide.
 * Auth routes use max-w-7xl in AuthPageShell only.
 */
export const APP_SHELL_WIDTH_CLASS = "mx-auto w-full min-w-0";

/** Detail pages — shell width + vertical section gap (shared with list inner wrappers). */
export const APP_SHELL_DETAIL_CLASS = `${APP_SHELL_WIDTH_CLASS} space-y-4`;

/** REQ-0045 — consistent gap below page/list section headers (matches OrderList, InvoiceList). */
export const PAGE_SECTION_HEADER_SPACING_CLASS = "pb-6";

/** Stats card grid — bottom gap before filters/table row. */
export const PAGE_STATS_GRID_CLASS =
  "grid gap-2 items-stretch pb-6";
