/**
 * Theme classes for table footer page-size Select (matches per-domain table accents).
 */

export type PaginationSelectVariant =
  | "sky"
  | "violet"
  | "rose"
  | "teal"
  | "amber"
  | "emerald";

export type PaginationSelectVariantStyles = {
  placeholder: string;
  trigger: string;
  content: string;
  item: string;
};

export const PAGINATION_SELECT_VARIANTS: Record<
  PaginationSelectVariant,
  PaginationSelectVariantStyles
> = {
  sky: {
    placeholder:
      "h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium",
    trigger:
      "h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-sm transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15 dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15 font-medium px-2 w-16 sm:w-20",
    content:
      "rounded-[28px] border border-sky-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(2,132,199,0.15)]",
    item: "text-gray-700 dark:text-white/80 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  violet: {
    placeholder:
      "h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium",
    trigger:
      "h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/15 to-violet-500/10 dark:from-violet-500/25 dark:via-violet-500/15 dark:to-violet-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(139,92,246,0.2)] backdrop-blur-sm transition duration-200 hover:border-violet-300/40 hover:from-violet-500/35 hover:via-violet-500/25 hover:to-violet-500/15 dark:hover:border-violet-300/40 dark:hover:from-violet-500/35 dark:hover:via-violet-500/25 dark:hover:to-violet-500/15 font-medium px-2 w-16 sm:w-20",
    content:
      "rounded-[28px] border border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(139,92,246,0.15)]",
    item: "text-gray-700 dark:text-white/80 focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  rose: {
    placeholder:
      "h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium",
    trigger:
      "h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 dark:from-rose-500/25 dark:via-rose-500/15 dark:to-rose-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-sm transition duration-200 hover:border-rose-300/40 hover:from-rose-500/35 hover:via-rose-500/25 hover:to-rose-500/15 dark:hover:border-rose-300/40 dark:hover:from-rose-500/35 dark:hover:via-rose-500/25 dark:hover:to-rose-500/15 font-medium px-2 w-16 sm:w-20",
    content:
      "rounded-[28px] border border-rose-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(225,29,72,0.15)]",
    item: "text-gray-700 dark:text-white/80 focus:bg-rose-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  teal: {
    placeholder:
      "h-10 rounded-[28px] border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/25 via-teal-500/15 to-teal-500/10 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium",
    trigger:
      "h-10 rounded-[28px] border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/25 via-teal-500/15 to-teal-500/10 dark:from-teal-500/25 dark:via-teal-500/15 dark:to-teal-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(20,184,166,0.2)] backdrop-blur-sm transition duration-200 hover:border-teal-300/40 font-medium px-2 w-16 sm:w-20",
    content:
      "rounded-[28px] border border-teal-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(20,184,166,0.15)]",
    item: "text-gray-700 dark:text-white/80 focus:bg-teal-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  amber: {
    placeholder:
      "h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-500/10 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium",
    trigger:
      "h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-500/10 dark:from-amber-500/25 dark:via-amber-500/15 dark:to-amber-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(245,158,11,0.2)] backdrop-blur-sm transition duration-200 hover:border-amber-300/40 font-medium px-2 w-16 sm:w-20",
    content:
      "rounded-[28px] border border-amber-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(245,158,11,0.15)]",
    item: "text-gray-700 dark:text-white/80 focus:bg-amber-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
  emerald: {
    placeholder:
      "h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium",
    trigger:
      "h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-sm transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15 font-medium px-2 w-16 sm:w-20",
    content:
      "rounded-[28px] border border-emerald-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(16,185,129,0.15)]",
    item: "text-gray-700 dark:text-white/80 focus:bg-emerald-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white",
  },
};

export const PAGE_SIZE_OPTIONS = [4, 6, 8, 10, 15, 20, 30] as const;
