/**
 * Icon container tones for section/page headers (ChartCard, PageSectionHeader, etc.).
 */

export type SectionHeaderTone =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "neutral";

export const SECTION_HEADER_ICON_TONE: Record<
  SectionHeaderTone,
  { container: string; icon: string }
> = {
  sky: {
    container:
      "border-sky-300/30 bg-sky-100/50 dark:border-sky-400/30 dark:bg-sky-500/20",
    icon: "text-sky-600 dark:text-sky-400",
  },
  emerald: {
    container:
      "border-emerald-300/30 bg-emerald-100/50 dark:border-emerald-400/30 dark:bg-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    container:
      "border-amber-300/30 bg-amber-100/50 dark:border-amber-400/30 dark:bg-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    container:
      "border-rose-300/30 bg-rose-100/50 dark:border-rose-400/30 dark:bg-rose-500/20",
    icon: "text-rose-600 dark:text-rose-400",
  },
  violet: {
    container:
      "border-violet-300/30 bg-violet-100/50 dark:border-violet-400/30 dark:bg-violet-500/20",
    icon: "text-violet-600 dark:text-violet-400",
  },
  blue: {
    container:
      "border-blue-300/30 bg-blue-100/50 dark:border-blue-400/30 dark:bg-blue-500/20",
    icon: "text-sky-600 dark:text-sky-400",
  },
  orange: {
    container:
      "border-orange-300/30 bg-orange-100/50 dark:border-orange-400/30 dark:bg-orange-500/20",
    icon: "text-orange-600 dark:text-orange-400",
  },
  teal: {
    container:
      "border-teal-300/30 bg-teal-100/50 dark:border-teal-400/30 dark:bg-teal-500/20",
    icon: "text-teal-600 dark:text-teal-400",
  },
  neutral: {
    container:
      "border-gray-300/30 bg-gray-100/50 dark:border-white/15 dark:bg-white/10",
    icon: "text-gray-700 dark:text-white/80",
  },
};
