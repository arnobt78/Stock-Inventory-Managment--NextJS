/**
 * Section card header — icon left, title + optional subtitle right.
 * Icon container stretches to match combined text line height (client-portal pattern).
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECTION_HEADER_ICON_TONE,
  type SectionHeaderTone,
} from "@/lib/ui/section-header-tones";

export type SectionCardHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  tone?: SectionHeaderTone;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionCardHeader({
  title,
  description,
  icon: Icon,
  tone = "neutral",
  className,
  titleClassName,
  descriptionClassName,
}: SectionCardHeaderProps) {
  const toneConfig = SECTION_HEADER_ICON_TONE[tone];

  return (
    <div className={cn("flex items-stretch gap-2 sm:gap-3", className)}>
      {Icon && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center self-stretch rounded-xl border px-2 py-1.5 sm:px-2.5",
            toneConfig.container,
          )}
        >
          <Icon className={cn("h-5 w-5", toneConfig.icon)} />
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-center">
        <h3
          className={cn(
            "text-base font-medium leading-tight text-gray-700 dark:text-white sm:text-lg",
            titleClassName,
          )}
        >
          {title}
        </h3>
        {description != null && description !== "" && (
          <p
            className={cn(
              "text-xs leading-tight text-gray-600 dark:text-white/70 sm:text-sm",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
