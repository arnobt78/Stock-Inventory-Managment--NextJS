/**
 * REQ-0079/0080 — glass counter badge for section title numeric counts only.
 * Default slate/gray hue — visible in light + dark. Not used on StatisticsCard sub-badges.
 * Render as sibling of title text (never inside p/h3) — see SectionTitleRow.
 */
import React from "react";
import {
  GLASS_BADGE_CLASS,
  type GlassBadgeHue,
} from "@/lib/ui/glass-badge-styles";
import { cn } from "@/lib/utils";

export type SectionCountBadgeProps = {
  children: React.ReactNode;
  /** Optional hue override; default slate for all section counters (REQ-0080) */
  hue?: GlassBadgeHue;
  className?: string;
};

export function SectionCountBadge({
  children,
  hue = "slate",
  className,
}: SectionCountBadgeProps) {
  return (
    <span
      className={cn(
        "relative isolate inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-normal text-xs",
        GLASS_BADGE_CLASS[hue],
        className,
      )}
    >
      {children}
    </span>
  );
}
