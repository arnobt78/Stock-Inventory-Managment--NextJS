"use client";

/**
 * REQ-0117 — consistent dialog header: icon tile + title + subtitle.
 */

import type { LucideIcon } from "lucide-react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DialogHeaderBrandTone =
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "indigo"
  | "teal";

const toneStyles: Record<
  DialogHeaderBrandTone,
  { tile: string; icon: string; title: string }
> = {
  sky: {
    tile: "border-sky-400/30 bg-sky-500/20",
    icon: "text-sky-600 dark:text-sky-400",
    title: "text-white",
  },
  emerald: {
    tile: "border-emerald-400/30 bg-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-white",
  },
  violet: {
    tile: "border-violet-400/30 bg-violet-500/20",
    icon: "text-violet-600 dark:text-violet-400",
    title: "text-white",
  },
  amber: {
    tile: "border-amber-400/30 bg-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-white",
  },
  rose: {
    tile: "border-rose-400/30 bg-rose-500/20",
    icon: "text-rose-600 dark:text-rose-400",
    title: "text-white",
  },
  indigo: {
    tile: "border-indigo-400/30 bg-indigo-500/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    title: "text-white",
  },
  teal: {
    tile: "border-teal-400/30 bg-teal-500/20",
    icon: "text-teal-600 dark:text-teal-400",
    title: "text-white",
  },
};

export type DialogHeaderBrandProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: DialogHeaderBrandTone;
  className?: string;
};

export function DialogHeaderBrand({
  icon: Icon,
  title,
  description,
  tone = "sky",
  className,
}: DialogHeaderBrandProps) {
  const styles = toneStyles[tone];

  return (
    <DialogHeader className={cn("text-left space-y-0", className)}>
      <div className="flex items-start gap-3 min-h-[3.25rem]">
        <div className={cn("p-2 rounded-xl border shrink-0", styles.tile)}>
          <Icon className={cn("h-5 w-5", styles.icon)} aria-hidden />
        </div>
        <div className="flex flex-col gap-0 min-w-0">
          <DialogTitle
            className={cn(
              "text-[22px] leading-tight font-medium p-0",
              styles.title,
            )}
          >
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-white/70 text-sm leading-snug m-0">
              {description}
            </DialogDescription>
          ) : null}
        </div>
      </div>
    </DialogHeader>
  );
}
