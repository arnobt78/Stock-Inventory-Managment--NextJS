/**
 * REQ-0078 — section title row with optional trailing badges.
 * REQ-0079 — count + countHue render SectionCountBadge (glass glow, valid HTML sibling).
 * Badge (shadcn) renders a <div>; never nest it inside <p> or heading phrasing-only tags.
 */
import React from "react";
import type { LucideIcon } from "lucide-react";
import { SectionCountBadge } from "@/components/shared/SectionCountBadge";
import type { GlassBadgeHue } from "@/lib/ui/glass-badge-styles";
import { cn } from "@/lib/utils";

export const SECTION_TITLE_ROW_CLASS =
  "flex items-center gap-2 flex-wrap text-gray-700 dark:text-white text-sm sm:text-base font-medium";

export type SectionTitleRowProps = {
  title: string;
  /** Title element — use h3 for card sections, span for catalog subsections */
  as?: "h3" | "span" | "div";
  icon?: LucideIcon;
  iconClassName?: string;
  /** Numeric count — renders SectionCountBadge when set (unless trailing overrides) */
  count?: number;
  /** Hue for count badge (default slate) */
  countHue?: GlassBadgeHue;
  /** Badges or counts — rendered as siblings after the title; overrides count when set */
  trailing?: React.ReactNode;
  className?: string;
};

export function SectionTitleRow({
  title,
  as: TitleTag = "span",
  icon: Icon,
  iconClassName,
  count,
  countHue,
  trailing,
  className,
}: SectionTitleRowProps) {
  const trailingNode =
    trailing ??
    (count != null ? (
      <SectionCountBadge hue={countHue}>{count}</SectionCountBadge>
    ) : null);

  return (
    <div className={cn(SECTION_TITLE_ROW_CLASS, className)}>
      {Icon ? (
        <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} aria-hidden />
      ) : null}
      <TitleTag className="font-medium">{title}</TitleTag>
      {trailingNode}
    </div>
  );
}
