/**
 * Badge surfaces:
 * - OPAQUE_BADGE_CLASS — default table/detail chips (inline Tailwind utilities)
 * - GLASS_BADGE_CLASS — calendar-style gradient glow (product stock, active/inactive catalog entities)
 */

export type GlassBadgeHue =
  | "yellow"
  | "blue"
  | "purple"
  | "indigo"
  | "emerald"
  | "red"
  | "amber"
  | "violet"
  | "orange"
  | "gray"
  | "rose"
  | "teal"
  | "cyan"
  | "slate"
  | "sky";

/** Opaque filter-chip style — used by orders, invoices, roles, warehouse types, etc. */
export const OPAQUE_BADGE_CLASS: Record<GlassBadgeHue, string> = {
  yellow:
    "border-yellow-200/90 bg-yellow-100 text-yellow-800 shadow-[0_2px_8px_rgba(234,179,8,0.12)] dark:border-yellow-500/30 dark:bg-yellow-950/50 dark:text-yellow-300",
  blue: "border-blue-200/90 bg-blue-100 text-sky-800 shadow-[0_2px_8px_rgba(59,130,246,0.12)] dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-sky-300",
  purple:
    "border-purple-200/90 bg-purple-100 text-purple-800 shadow-[0_2px_8px_rgba(168,85,247,0.12)] dark:border-purple-500/30 dark:bg-purple-950/50 dark:text-purple-300",
  indigo:
    "border-indigo-200/90 bg-indigo-100 text-indigo-800 shadow-[0_2px_8px_rgba(99,102,241,0.12)] dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-300",
  emerald:
    "border-emerald-200/90 bg-emerald-100 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.12)] dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300",
  red: "border-red-200/90 bg-red-100 text-red-800 shadow-[0_2px_8px_rgba(239,68,68,0.12)] dark:border-red-500/30 dark:bg-red-950/50 dark:text-red-300",
  amber:
    "border-amber-200/90 bg-amber-100 text-amber-800 shadow-[0_2px_8px_rgba(245,158,11,0.12)] dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300",
  violet:
    "border-violet-200/90 bg-violet-100 text-violet-800 shadow-[0_2px_8px_rgba(139,92,246,0.12)] dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300",
  orange:
    "border-orange-200/90 bg-orange-100 text-orange-800 shadow-[0_2px_8px_rgba(249,115,22,0.12)] dark:border-orange-500/30 dark:bg-orange-950/50 dark:text-orange-300",
  gray: "border-gray-200/90 bg-gray-100 text-gray-700 shadow-[0_2px_8px_rgba(107,114,128,0.1)] dark:border-gray-500/30 dark:bg-gray-900/50 dark:text-gray-300",
  rose: "border-rose-200/90 bg-rose-100 text-rose-800 shadow-[0_2px_8px_rgba(244,63,94,0.12)] dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-300",
  teal: "border-teal-200/90 bg-teal-100 text-teal-800 shadow-[0_2px_8px_rgba(20,184,166,0.12)] dark:border-teal-500/30 dark:bg-teal-950/50 dark:text-teal-300",
  cyan: "border-cyan-200/90 bg-cyan-100 text-cyan-800 shadow-[0_2px_8px_rgba(6,182,212,0.12)] dark:border-cyan-500/30 dark:bg-cyan-950/50 dark:text-cyan-300",
  slate:
    "border-slate-200/90 bg-slate-100 text-slate-700 shadow-[0_2px_8px_rgba(100,116,139,0.1)] dark:border-slate-500/30 dark:bg-slate-900/50 dark:text-slate-300",
  sky: "border-sky-200/90 bg-sky-100 text-sky-800 shadow-[0_2px_8px_rgba(14,165,233,0.12)] dark:border-sky-500/30 dark:bg-sky-950/50 dark:text-sky-300",
};

/**
 * REQ-0150 — solid filled pill for Select triggers (white icon + label on hue).
 * Use with SemanticBadge contrast="solid".
 */
export const SOLID_BADGE_CLASS: Record<GlassBadgeHue, string> = {
  yellow:
    "border-yellow-500/50 bg-yellow-500 !text-white shadow-[0_4px_14px_rgba(234,179,8,0.35)]",
  blue: "border-blue-500/50 bg-blue-500 !text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)]",
  purple:
    "border-purple-500/50 bg-purple-500 !text-white shadow-[0_4px_14px_rgba(168,85,247,0.35)]",
  indigo:
    "border-indigo-500/50 bg-indigo-500 !text-white shadow-[0_4px_14px_rgba(99,102,241,0.35)]",
  emerald:
    "border-emerald-500/50 bg-emerald-500 !text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]",
  red: "border-red-500/50 bg-red-500 !text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)]",
  amber:
    "border-amber-500/50 bg-amber-500 !text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)]",
  violet:
    "border-violet-500/50 bg-violet-500 !text-white shadow-[0_4px_14px_rgba(139,92,246,0.35)]",
  orange:
    "border-orange-500/50 bg-orange-500 !text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]",
  gray: "border-gray-500/50 bg-gray-500 !text-white shadow-[0_4px_14px_rgba(107,114,128,0.3)]",
  rose: "border-rose-500/50 bg-rose-500 !text-white shadow-[0_4px_14px_rgba(244,63,94,0.35)]",
  teal: "border-teal-500/50 bg-teal-500 !text-white shadow-[0_4px_14px_rgba(20,184,166,0.35)]",
  cyan: "border-cyan-500/50 bg-cyan-500 !text-white shadow-[0_4px_14px_rgba(6,182,212,0.35)]",
  slate:
    "border-slate-500/50 bg-slate-500 !text-white shadow-[0_4px_14px_rgba(100,116,139,0.3)]",
  sky: "border-sky-500/50 bg-sky-500 !text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)]",
};

/** Calendar glass gradient — readable in light + dark (Tailwind v3 safe). */
export const GLASS_BADGE_CLASS: Record<GlassBadgeHue, string> = {
  yellow:
    "border-yellow-400/35 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/5 text-yellow-700 shadow-[0_10px_28px_rgba(234,179,8,0.18)] backdrop-blur-md dark:border-yellow-500/40 dark:from-yellow-500/30 dark:via-yellow-500/18 dark:to-yellow-500/8 dark:text-yellow-300 dark:shadow-[0_4px_14px_rgba(234,179,8,0.12)]",
  blue: "border-blue-400/35 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-blue-500/5 text-sky-700 shadow-[0_10px_28px_rgba(59,130,246,0.18)] backdrop-blur-md dark:border-blue-500/40 dark:from-blue-500/30 dark:via-blue-500/18 dark:to-blue-500/8 dark:text-sky-300 dark:shadow-[0_4px_14px_rgba(59,130,246,0.12)]",
  purple:
    "border-purple-400/35 bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-purple-500/5 text-purple-700 shadow-[0_10px_28px_rgba(168,85,247,0.18)] backdrop-blur-md dark:border-purple-500/40 dark:from-purple-500/30 dark:via-purple-500/18 dark:to-purple-500/8 dark:text-purple-300 dark:shadow-[0_4px_14px_rgba(168,85,247,0.12)]",
  indigo:
    "border-indigo-400/35 bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-indigo-500/5 text-indigo-700 shadow-[0_10px_28px_rgba(99,102,241,0.18)] backdrop-blur-md dark:border-indigo-500/40 dark:from-indigo-500/30 dark:via-indigo-500/18 dark:to-indigo-500/8 dark:text-indigo-300 dark:shadow-[0_4px_14px_rgba(99,102,241,0.12)]",
  emerald:
    "border-emerald-400/35 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 text-emerald-700 shadow-[0_10px_28px_rgba(16,185,129,0.18)] backdrop-blur-md dark:border-emerald-500/40 dark:from-emerald-500/30 dark:via-emerald-500/18 dark:to-emerald-500/8 dark:text-emerald-300 dark:shadow-[0_4px_14px_rgba(16,185,129,0.12)]",
  red: "border-red-400/35 bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/5 text-red-700 shadow-[0_10px_28px_rgba(239,68,68,0.18)] backdrop-blur-md dark:border-red-500/40 dark:from-red-500/30 dark:via-red-500/18 dark:to-red-500/8 dark:text-red-300 dark:shadow-[0_4px_14px_rgba(239,68,68,0.12)]",
  amber:
    "border-amber-400/35 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 text-amber-700 shadow-[0_10px_28px_rgba(245,158,11,0.18)] backdrop-blur-md dark:border-amber-500/40 dark:from-amber-500/30 dark:via-amber-500/18 dark:to-amber-500/8 dark:text-amber-300 dark:shadow-[0_4px_14px_rgba(245,158,11,0.12)]",
  violet:
    "border-violet-400/35 bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-violet-500/5 text-violet-700 shadow-[0_10px_28px_rgba(139,92,246,0.18)] backdrop-blur-md dark:border-violet-500/40 dark:from-violet-500/30 dark:via-violet-500/18 dark:to-violet-500/8 dark:text-violet-300 dark:shadow-[0_4px_14px_rgba(139,92,246,0.12)]",
  orange:
    "border-orange-400/35 bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-orange-500/5 text-orange-700 shadow-[0_10px_28px_rgba(249,115,22,0.18)] backdrop-blur-md dark:border-orange-500/40 dark:from-orange-500/30 dark:via-orange-500/18 dark:to-orange-500/8 dark:text-orange-300 dark:shadow-[0_4px_14px_rgba(249,115,22,0.12)]",
  gray: "border-gray-400/35 bg-gradient-to-r from-gray-500/20 via-gray-500/10 to-gray-500/5 text-gray-700 shadow-[0_10px_28px_rgba(107,114,128,0.16)] backdrop-blur-md dark:border-gray-500/40 dark:from-gray-500/30 dark:via-gray-500/18 dark:to-gray-500/8 dark:text-gray-300 dark:shadow-[0_4px_14px_rgba(107,114,128,0.12)]",
  rose: "border-rose-400/35 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-rose-500/5 text-rose-700 shadow-[0_10px_28px_rgba(225,29,72,0.18)] backdrop-blur-md dark:border-rose-500/40 dark:from-rose-500/30 dark:via-rose-500/18 dark:to-rose-500/8 dark:text-rose-300 dark:shadow-[0_4px_14px_rgba(225,29,72,0.12)]",
  teal: "border-teal-400/35 bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-teal-500/5 text-teal-700 shadow-[0_10px_28px_rgba(20,184,166,0.18)] backdrop-blur-md dark:border-teal-500/40 dark:from-teal-500/30 dark:via-teal-500/18 dark:to-teal-500/8 dark:text-teal-300 dark:shadow-[0_4px_14px_rgba(20,184,166,0.12)]",
  cyan: "border-cyan-400/35 bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-cyan-500/5 text-cyan-700 shadow-[0_10px_28px_rgba(6,182,212,0.18)] backdrop-blur-md dark:border-cyan-500/40 dark:from-cyan-500/30 dark:via-cyan-500/18 dark:to-cyan-500/8 dark:text-cyan-300 dark:shadow-[0_4px_14px_rgba(6,182,212,0.12)]",
  slate:
    "border-slate-400/35 bg-gradient-to-r from-slate-500/20 via-slate-500/10 to-slate-500/5 text-slate-600 shadow-[0_10px_28px_rgba(100,116,139,0.16)] backdrop-blur-md dark:border-slate-500/40 dark:from-slate-500/30 dark:via-slate-500/18 dark:to-slate-500/8 dark:text-slate-300 dark:shadow-[0_4px_14px_rgba(100,116,139,0.12)]",
  sky: "border-sky-400/35 bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-sky-500/5 text-sky-700 shadow-[0_10px_28px_rgba(2,132,199,0.18)] backdrop-blur-md dark:border-sky-500/40 dark:from-sky-500/30 dark:via-sky-500/18 dark:to-sky-500/8 dark:text-sky-300 dark:shadow-[0_4px_14px_rgba(2,132,199,0.12)]",
};
