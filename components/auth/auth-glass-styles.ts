/** Glass tokens for auth login/register pages (REQ-0032, REQ-0033). */

import type { AuthListHue } from "@/lib/auth/auth-panel-copy";

export type AuthGlassVariant = "login" | "register";

/** Right form card — navbar-intensity frosted glass. */
export const AUTH_FORM_GLASS: Record<AuthGlassVariant, string> = {
  login:
    "border border-sky-400/30 dark:border-white/10 bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-sky-500/5 dark:from-white/10 dark:via-white/8 dark:to-white/5 backdrop-blur-2xl shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-lg transition-all duration-300 hover:shadow-[0_40px_100px_rgba(2,132,199,0.5)] dark:hover:shadow-[0_40px_100px_rgba(2,132,199,0.4)] hover:border-sky-300/50 dark:hover:border-sky-300/30",
  register:
    "border border-emerald-400/30 dark:border-white/10 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 dark:from-white/10 dark:via-white/8 dark:to-white/5 backdrop-blur-2xl shadow-[0_30px_80px_rgba(16,185,129,0.35)] dark:shadow-lg transition-all duration-300 hover:shadow-[0_40px_100px_rgba(16,185,129,0.5)] dark:hover:shadow-[0_40px_100px_rgba(16,185,129,0.4)] hover:border-emerald-300/50 dark:hover:border-emerald-300/30",
};

/** Per-row micro-glass on flat left list (not a parent card). REQ-0033: py-2 for tighter rhythm. */
export const AUTH_LIST_ROW_GLASS =
  "rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-md px-4 py-2";

/**
 * REQ-0033 — icon pill glass glow (matches AuthBrandHeader rose box + GLASS_BADGE_CLASS pattern).
 * Applied on login + register list rows in AuthInfoListItem.
 */
export const AUTH_LIST_ICON_GLASS: Record<AuthListHue, string> = {
  sky:
    "border-sky-400/35 bg-gradient-to-br from-sky-500/30 via-sky-500/15 to-sky-500/8 shadow-[0_5px_20px_rgba(14,165,233,0.3)] dark:border-sky-400/30 dark:from-sky-500/25 dark:via-sky-500/12 dark:to-sky-500/6 dark:shadow-[0_5px_20px_rgba(14,165,233,0.25)] backdrop-blur-md",
  emerald:
    "border-emerald-400/35 bg-gradient-to-br from-emerald-500/30 via-emerald-500/15 to-emerald-500/8 shadow-[0_5px_20px_rgba(16,185,129,0.3)] dark:border-emerald-400/30 dark:from-emerald-500/25 dark:via-emerald-500/12 dark:to-emerald-500/6 dark:shadow-[0_5px_20px_rgba(16,185,129,0.25)] backdrop-blur-md",
  amber:
    "border-amber-400/35 bg-gradient-to-br from-amber-500/30 via-amber-500/15 to-amber-500/8 shadow-[0_5px_20px_rgba(245,158,11,0.3)] dark:border-amber-400/30 dark:from-amber-500/25 dark:via-amber-500/12 dark:to-amber-500/6 dark:shadow-[0_5px_20px_rgba(245,158,11,0.25)] backdrop-blur-md",
  violet:
    "border-violet-400/35 bg-gradient-to-br from-violet-500/30 via-violet-500/15 to-violet-500/8 shadow-[0_5px_20px_rgba(139,92,246,0.3)] dark:border-violet-400/30 dark:from-violet-500/25 dark:via-violet-500/12 dark:to-violet-500/6 dark:shadow-[0_5px_20px_rgba(139,92,246,0.25)] backdrop-blur-md",
  blue:
    "border-blue-400/35 bg-gradient-to-br from-blue-500/30 via-blue-500/15 to-blue-500/8 shadow-[0_5px_20px_rgba(59,130,246,0.3)] dark:border-blue-400/30 dark:from-blue-500/25 dark:via-blue-500/12 dark:to-blue-500/6 dark:shadow-[0_5px_20px_rgba(59,130,246,0.25)] backdrop-blur-md",
};
