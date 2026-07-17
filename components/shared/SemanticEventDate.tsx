"use client";

/**
 * REQ-0145 — compact date + icon with semantic hue (paid / cancelled / refunded / …).
 * Used by order Status, Payment, and Invoice # table cells.
 */

import {
  Ban,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  PackageCheck,
  RefreshCcw,
  Send,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ClientDate } from "@/components/shared/ClientDateDisplay";
import { ClientCompactDateTime } from "@/components/shared/ClientFormatDisplay";
import {
  type SemanticDateKind,
  semanticDateClass,
} from "@/lib/ui/semantic-date-styles";
import { cn } from "@/lib/utils";

const EVENT_ICONS: Record<SemanticDateKind, LucideIcon> = {
  created: Calendar,
  updated: CalendarClock,
  expiration: CalendarClock,
  /** REQ-0151 — due/overdue use Clock (not Calendar) */
  due: Clock,
  paid: CheckCircle2,
  cancelled: Ban,
  refunded: RefreshCcw,
  shipped: Truck,
  delivered: PackageCheck,
  sent: Send,
  overdue: Clock,
  scheduled: CalendarClock,
  completed: CheckCircle2,
};

export type SemanticEventDateProps = {
  date: Date | string;
  kind: SemanticDateKind;
  /** compact datetime (default) vs date-only */
  mode?: "datetime" | "date";
  className?: string;
};

export function SemanticEventDate({
  date,
  kind,
  mode = "datetime",
  className,
}: SemanticEventDateProps) {
  const Icon = EVENT_ICONS[kind] ?? Calendar;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs shrink-0",
        semanticDateClass(kind),
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {mode === "date" ? (
        <ClientDate date={date} semantic={kind} className="text-xs" />
      ) : (
        <ClientCompactDateTime date={date} semantic={kind} className="text-xs" />
      )}
    </span>
  );
}
