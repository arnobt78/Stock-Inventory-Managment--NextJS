"use client";

import React from "react";
import { cn } from "@/lib/utils";

/** Preset widths/heights for inline data-slot pulse (REQ-0021 — shell-first nav). */
export type DataSlotPulseVariant =
  | "metric"
  | "currency"
  | "badge"
  | "date"
  | "text-sm"
  | "text-md"
  | "text-lg"
  | "chart";

const variantClass: Record<DataSlotPulseVariant, string> = {
  metric: "inline-block h-8 min-w-[3rem] w-16",
  currency: "inline-block h-8 min-w-[5rem] w-24",
  badge: "inline-block h-4 min-w-[1.5rem] w-10",
  date: "inline-block h-4 min-w-[6rem] w-28",
  "text-sm": "inline-block h-4 min-w-[4rem] w-20",
  "text-md": "inline-block h-5 min-w-[5rem] w-24",
  "text-lg": "inline-block h-8 min-w-[6rem] w-32",
  chart: "block h-full min-h-[200px] w-full",
};

export type DataSlotPulseProps = {
  variant?: DataSlotPulseVariant;
  className?: string;
};

/**
 * Inline pulse placeholder for a single dynamic value (number, currency, date).
 * Keeps card titles, table headers, and labels visible while data loads.
 */
export function DataSlotPulse({
  variant = "metric",
  className,
}: DataSlotPulseProps) {
  return (
    <span
      className={cn(
        "animate-pulse rounded-md bg-muted align-middle",
        variantClass[variant],
        className,
      )}
      aria-hidden
    />
  );
}
