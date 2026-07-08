/**
 * Format barrel — stable SSR helpers + client-locale Intl (REQ-0020).
 */

export {
  toDate,
  formatStableDate,
  formatStableDateTime,
  formatStableRelative,
  formatStableNumber,
  formatStableCurrency,
  formatStableCompactDateTime,
} from "@/lib/date/format-stable";

export {
  formatClientCurrency,
  formatClientCompactDateTime,
  formatClientNumber,
} from "./client-locale";
