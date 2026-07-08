/**
 * Browser-locale formatters (REQ-0020).
 * Call only on the client after mount or in event handlers — not during SSR.
 * USD base; grouping/decimals follow visitor locale for global demo users.
 */

import { toDate } from "@/lib/date/format-stable";

/** USD with browser locale grouping (e.g. 1.234,56 in de-DE). */
export function formatClientCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Compact date+time in visitor local timezone. */
export function formatClientCompactDateTime(
  value: Date | string | number,
): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(value));
}

/** Integer/count with browser locale grouping. */
export function formatClientNumber(value: number): string {
  return new Intl.NumberFormat(undefined).format(value);
}
