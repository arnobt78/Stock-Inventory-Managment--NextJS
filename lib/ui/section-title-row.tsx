/**
 * REQ-0078 — section title row with optional trailing badges.
 * REQ-0079 — count + optional countHue render SectionCountBadge (default slate per REQ-0080).
 * REQ-0138 — optional subtitle + icon tile (h-9) spanning title+subtitle block.
 * Badge (shadcn) renders a <div>; never nest it inside <p> or heading phrasing-only tags.
 */
import React from "react";
import type { LucideIcon } from "lucide-react";
import { SectionCountBadge } from "@/components/shared/SectionCountBadge";
import type { GlassBadgeHue } from "@/lib/ui/glass-badge-styles";
import { cn } from "@/lib/utils";

export const SECTION_TITLE_ROW_CLASS =
  "flex gap-2 flex-wrap text-gray-700 dark:text-white text-sm sm:text-base font-medium";

export type SectionTitleRowProps = {
  title: string;
  /** Title element — use h3 for card sections, span for catalog subsections */
  as?: "h3" | "span" | "div";
  icon?: LucideIcon;
  iconClassName?: string;
  /**
   * When true (or when subtitle is set), wrap icon in h-9 tile aligned to title+subtitle.
   */
  iconTile?: boolean;
  /** Secondary line under title (help copy / justify-between content) */
  subtitle?: React.ReactNode;
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
  iconTile = false,
  subtitle,
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

  const useTile = iconTile || subtitle != null;

  const iconNode =
    Icon != null ? (
      useTile ? (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-300/40 bg-gray-100/60 dark:border-white/15 dark:bg-white/10"
          aria-hidden
        >
          <Icon className={cn("h-4 w-4", iconClassName)} />
        </div>
      ) : (
        <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} aria-hidden />
      )
    ) : null;

  return (
    <div
      className={cn(
        SECTION_TITLE_ROW_CLASS,
        useTile ? "items-start" : "items-center",
        className,
      )}
    >
      {iconNode}
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <TitleTag className="font-medium">{title}</TitleTag>
          {trailingNode}
        </div>
        {subtitle != null ? (
          <div className="text-xs font-normal text-gray-600 dark:text-white/60 w-full">
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
