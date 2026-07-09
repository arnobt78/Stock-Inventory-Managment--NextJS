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
        <TitleTag className="text-lg font-medium leading-tight text-gray-700 dark:text-white sm:text-xl">
          {title}
        </TitleTag>
        {description != null && description !== "" && (
          <p className="text-xs leading-tight text-gray-600 dark:text-gray-400 sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {trailing}
    </div>
  );
}
