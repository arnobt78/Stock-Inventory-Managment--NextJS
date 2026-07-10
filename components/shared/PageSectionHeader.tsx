/**
 * Page-level section header — meaningful icon beside title/subtitle (list + detail pages).
 * Excludes StatisticsCard summary badges/cards.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECTION_HEADER_ICON_TONE,
  type SectionHeaderTone,
} from "@/lib/ui/section-header-tones";
import { PAGE_SECTION_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import { TYPO_PAGE_HEADER, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";

export type PageSectionHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  tone?: SectionHeaderTone;
  as?: "h1" | "h2";
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
};

export function PageSectionHeader({
  title,
  description,
  icon: Icon,
  tone = "sky",
  as: TitleTag = "h2",
  leading,
  trailing,
  className,
}: PageSectionHeaderProps) {
  const toneConfig = SECTION_HEADER_ICON_TONE[tone];

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 sm:gap-3 text-left",
        PAGE_SECTION_HEADER_SPACING_CLASS,
        className,
      )}
    >
      {leading}
      {Icon && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center self-stretch rounded-xl border px-2 py-1.5 sm:px-2.5",
            toneConfig.container,
          )}
        >
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", toneConfig.icon)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <TitleTag className={TYPO_PAGE_HEADER}>
          {title}
        </TitleTag>
        {description != null && description !== "" && (
          <p className={TYPO_SUBTITLE}>
            {description}
          </p>
        )}
      </div>
      {trailing}
    </div>
  );
}
