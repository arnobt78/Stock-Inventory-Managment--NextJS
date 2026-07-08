/**
 * Locale-stable date formatting for SSR + client hydration.
 * Avoids toLocaleDateString / formatDistanceToNow mismatches (server vs browser locale/time).
 */

import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Fixed pattern for SSR and hydration (en-US). */
export function formatStableDate(value: Date | string | number): string {
  return format(toDate(value), "MMM d, yyyy", { locale: enUS });
}

/** Fixed date + time for detail pages (en-US). */
export function formatStableDateTime(value: Date | string | number): string {
  return format(toDate(value), "MMM d, yyyy h:mm a", { locale: enUS });
}

/** Relative time — use only after mount (see ClientRelativeTime). */
export function formatStableRelative(value: Date | string | number): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true });
}

const STABLE_NUMBER = new Intl.NumberFormat("en-US");

/** Integer/count formatting — same on server and client (en-US). */
export function formatStableNumber(value: number): string {
  return STABLE_NUMBER.format(value);
}

const STABLE_CURRENCY = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** USD display — en-US locale; avoids de-DE hydration mismatches on admin dashboard. */
export function formatStableCurrency(value: number): string {
  return `$${STABLE_CURRENCY.format(value)}`;
}

const STABLE_COMPACT_UTC = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/**
 * Compact date+time in UTC — identical on Vercel (UTC) and any client TZ (REQ-0019).
 * Use for admin recent-activity lists to prevent React #418 text hydration errors.
 */
export function formatStableCompactDateTime(
  value: Date | string | number,
): string {
  return STABLE_COMPACT_UTC.format(toDate(value));
}
