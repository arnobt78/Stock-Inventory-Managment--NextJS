"use client";

/**
 * Hydration-safe currency/datetime — stable SSR first paint, browser locale after mount (REQ-0020).
 */

import { useMemo } from "react";
import {
  formatStableCompactDateTime,
  formatStableCurrency,
} from "@/lib/date/format-stable";
import {
  formatClientCompactDateTime,
  formatClientCurrency,
} from "@/lib/format/client-locale";
import { useMounted } from "@/hooks/use-mounted";
import {
  semanticDateClass,
  type SemanticDateKind,
} from "@/lib/ui/semantic-date-styles";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

export type ClientCurrencyProps = {
  value: number;
  className?: string;
};

/** USD — en-US stable on SSR, visitor locale grouping after mount. */
export function ClientCurrency({ value, className }: ClientCurrencyProps) {
  const mounted = useMounted();
  const label = useMemo(() => {
    if (!mounted) return formatStableCurrency(value);
    return formatClientCurrency(value);
  }, [mounted, value]);

  return <span className={className}>{label}</span>;
}

export type ClientCompactDateTimeProps = {
  date: DateInput;
  className?: string;
  semantic?: SemanticDateKind;
};

/** Compact datetime — UTC stable on SSR, visitor local TZ after mount. */
export function ClientCompactDateTime({
  date,
  className,
  semantic,
}: ClientCompactDateTimeProps) {
  const mounted = useMounted();
  const label = useMemo(() => {
    if (!mounted) return formatStableCompactDateTime(date);
    return formatClientCompactDateTime(date);
  }, [mounted, date]);

  return (
    <span
      className={cn(semanticDateClass(semantic), className)}
      title={mounted ? "Local time" : undefined}
    >
      {label}
    </span>
  );
}
