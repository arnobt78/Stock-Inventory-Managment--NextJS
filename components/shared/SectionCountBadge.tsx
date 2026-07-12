/**
 * REQ-0079 — glass counter badge for section titles and stat cards.
 * Uses GLASS_BADGE_CLASS for visible border + shadow glow in light and dark mode.
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
  /** Hue matches parent section/card tone */
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
