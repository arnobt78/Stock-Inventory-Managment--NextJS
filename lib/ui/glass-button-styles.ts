/**
 * REQ-0047 — glass CTA / toolbar buttons (shadow glow + hue focus ring + icon hover).
 * Builds on focus-ring-styles.ts; rings use box-shadow only (no layout shift).
 */
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
  type GlassFocusHue,
} from "@/lib/ui/focus-ring-styles";
import { cn } from "@/lib/utils";

/** Parent must include `group` — scales child svg on hover. */
export const GLASS_BUTTON_ICON_HOVER =
  "group [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:scale-110";

/** Strips shadcn Button default shadow bleed; do NOT use bg-transparent — it kills GLASS_PRIMARY gradients via tailwind-merge */
export const GLASS_BUTTON_SHELL_RESET =
  "shadow-none hover:shadow-none";

/** Faded disabled submit/toolbar state */
export const GLASS_BUTTON_DISABLED =
  "disabled:opacity-50 disabled:cursor-not-allowed";

const PRIMARY_LAYOUT =
  "h-11 inline-flex items-center justify-center rounded-xl backdrop-blur-md transition duration-200 !text-white font-normal";

const ACTION_LAYOUT =
  "inline-flex items-center justify-center rounded-xl backdrop-blur-md transition duration-200 font-normal text-gray-700 dark:text-white bg-white/80 dark:bg-transparent";

/** Cancel / reset — gray glass (dialog footers). */
export const GLASS_GHOST_BUTTON = `${FOCUS_NO_LAYOUT_SHIFT_CLASS} focus-visible:ring-2 focus-visible:ring-ring/50 dark:focus-visible:ring-white/35 h-11 inline-flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)] text-gray-700 dark:text-white`;

const PRIMARY_SKY = `${PRIMARY_LAYOUT} border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 shadow-[0_15px_35px_rgba(2,132,199,0.45)] dark:shadow-[0_15px_35px_rgba(2,132,199,0.25)] hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 dark:hover:border-sky-300/40 dark:hover:from-sky-500/80 dark:hover:via-sky-500/60 dark:hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)] dark:hover:shadow-[0_20px_45px_rgba(2,132,199,0.35)]`;

const PRIMARY_ROSE = `${PRIMARY_LAYOUT} border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 dark:from-rose-500/70 dark:via-rose-500/50 dark:to-rose-500/30 shadow-[0_15px_35px_rgba(225,29,72,0.45)] dark:shadow-[0_15px_35px_rgba(225,29,72,0.25)] hover:border-rose-300/40 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 dark:hover:border-rose-300/40 dark:hover:from-rose-500/80 dark:hover:via-rose-500/60 dark:hover:to-rose-500/40 hover:shadow-[0_20px_45px_rgba(225,29,72,0.6)] dark:hover:shadow-[0_20px_45px_rgba(225,29,72,0.35)]`;

const PRIMARY_EMERALD = `${PRIMARY_LAYOUT} border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 dark:from-emerald-500/70 dark:via-emerald-500/50 dark:to-emerald-500/30 shadow-[0_15px_35px_rgba(16,185,129,0.45)] dark:shadow-[0_15px_35px_rgba(16,185,129,0.25)] hover:border-emerald-300/40 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/80 dark:hover:via-emerald-500/60 dark:hover:to-emerald-500/40 hover:shadow-[0_20px_45px_rgba(16,185,129,0.6)] dark:hover:shadow-[0_20px_45px_rgba(16,185,129,0.35)]`;

const PRIMARY_VIOLET = `${PRIMARY_LAYOUT} border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 shadow-[0_15px_35px_rgba(139,92,246,0.45)] dark:shadow-[0_15px_35px_rgba(139,92,246,0.25)] hover:border-violet-300/40 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 dark:hover:border-violet-300/40 dark:hover:from-violet-500/80 dark:hover:via-violet-500/60 dark:hover:to-violet-500/40 hover:shadow-[0_20px_45px_rgba(139,92,246,0.6)] dark:hover:shadow-[0_20px_45px_rgba(139,92,246,0.35)]`;

const PRIMARY_INDIGO = `${PRIMARY_LAYOUT} border border-indigo-400/30 dark:border-indigo-400/30 bg-gradient-to-r from-indigo-500/70 via-indigo-500/50 to-indigo-500/30 dark:from-indigo-500/70 dark:via-indigo-500/50 dark:to-indigo-500/30 shadow-[0_15px_35px_rgba(99,102,241,0.45)] dark:shadow-[0_15px_35px_rgba(99,102,241,0.25)] hover:border-indigo-300/40 hover:from-indigo-500/80 hover:via-indigo-500/60 hover:to-indigo-500/40 dark:hover:border-indigo-300/40 dark:hover:from-indigo-500/80 dark:hover:via-indigo-500/60 dark:hover:to-indigo-500/40 hover:shadow-[0_20px_45px_rgba(99,102,241,0.6)] dark:hover:shadow-[0_20px_45px_rgba(99,102,241,0.35)]`;

const PRIMARY_AMBER = `${PRIMARY_LAYOUT} border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/70 via-amber-500/50 to-amber-500/30 dark:from-amber-500/70 dark:via-amber-500/50 dark:to-amber-500/30 shadow-[0_15px_35px_rgba(245,158,11,0.45)] dark:shadow-[0_15px_35px_rgba(245,158,11,0.25)] hover:border-amber-300/40 hover:from-amber-500/80 hover:via-amber-500/60 hover:to-amber-500/40 dark:hover:border-amber-300/40 dark:hover:from-amber-500/80 dark:hover:via-amber-500/60 dark:hover:to-amber-500/40 hover:shadow-[0_20px_45px_rgba(245,158,11,0.6)] dark:hover:shadow-[0_20px_45px_rgba(245,158,11,0.35)]`;

const PRIMARY_TEAL = `${PRIMARY_LAYOUT} border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/70 via-teal-500/50 to-teal-500/30 dark:from-teal-500/70 dark:via-teal-500/50 dark:to-teal-500/30 shadow-[0_15px_35px_rgba(20,184,166,0.45)] dark:shadow-[0_15px_35px_rgba(20,184,166,0.25)] hover:border-teal-300/40 hover:from-teal-500/80 hover:via-teal-500/60 hover:to-teal-500/40 dark:hover:border-teal-300/40 dark:hover:from-teal-500/80 dark:hover:via-teal-500/60 dark:hover:to-teal-500/40 hover:shadow-[0_20px_45px_rgba(20,184,166,0.6)] dark:hover:shadow-[0_20px_45px_rgba(20,184,166,0.35)]`;

const PRIMARY_CYAN = `${PRIMARY_LAYOUT} border border-cyan-400/30 dark:border-cyan-400/30 bg-gradient-to-r from-cyan-500/70 via-cyan-500/50 to-cyan-500/30 dark:from-cyan-500/70 dark:via-cyan-500/50 dark:to-cyan-500/30 shadow-[0_15px_35px_rgba(6,182,212,0.45)] dark:shadow-[0_15px_35px_rgba(6,182,212,0.25)] hover:border-cyan-300/40 hover:from-cyan-500/80 hover:via-cyan-500/60 hover:to-cyan-500/40 dark:hover:border-cyan-300/40 dark:hover:from-cyan-500/80 dark:hover:via-cyan-500/60 dark:hover:to-cyan-500/40 hover:shadow-[0_20px_45px_rgba(6,182,212,0.6)] dark:hover:shadow-[0_20px_45px_rgba(6,182,212,0.35)]`;

const PRIMARY_BLUE = `${PRIMARY_LAYOUT} border border-blue-400/30 dark:border-blue-400/30 bg-gradient-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30 dark:from-blue-500/70 dark:via-blue-500/50 dark:to-blue-500/30 shadow-[0_15px_35px_rgba(59,130,246,0.45)] dark:shadow-[0_15px_35px_rgba(59,130,246,0.25)] hover:border-blue-300/40 hover:from-blue-500/80 hover:via-blue-500/60 hover:to-blue-500/40 dark:hover:border-blue-300/40 dark:hover:from-blue-500/80 dark:hover:via-blue-500/60 dark:hover:to-blue-500/40 hover:shadow-[0_20px_45px_rgba(59,130,246,0.6)] dark:hover:shadow-[0_20px_45px_rgba(59,130,246,0.35)]`;

const ACTION_SKY = `${ACTION_LAYOUT} border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent dark:from-sky-500/20 dark:via-sky-500/10 hover:from-sky-500/30 dark:hover:from-sky-500/30 hover:border-sky-300/40 shadow-[0_10px_30px_rgba(2,132,199,0.2)] dark:shadow-[0_10px_30px_rgba(2,132,199,0.15)]`;

const ACTION_ROSE = `${ACTION_LAYOUT} border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent dark:from-rose-500/20 dark:via-rose-500/10 hover:from-rose-500/30 dark:hover:from-rose-500/30 hover:border-rose-300/40 shadow-[0_10px_30px_rgba(225,29,72,0.2)] dark:shadow-[0_10px_30px_rgba(225,29,72,0.15)]`;

const ACTION_EMERALD = `${ACTION_LAYOUT} border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 hover:from-emerald-500/30 dark:hover:from-emerald-500/30 hover:border-emerald-300/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] dark:shadow-[0_10px_30px_rgba(16,185,129,0.15)]`;

const ACTION_VIOLET = `${ACTION_LAYOUT} border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-transparent dark:from-violet-500/20 dark:via-violet-500/10 hover:from-violet-500/30 dark:hover:from-violet-500/30 hover:border-violet-300/40 shadow-[0_10px_30px_rgba(139,92,246,0.2)] dark:shadow-[0_10px_30px_rgba(139,92,246,0.15)]`;

const ACTION_INDIGO = `${ACTION_LAYOUT} border border-indigo-400/30 dark:border-indigo-400/30 bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/10 hover:from-indigo-500/30 dark:hover:from-indigo-500/30 hover:border-indigo-300/40 shadow-[0_10px_30px_rgba(99,102,241,0.2)] dark:shadow-[0_10px_30px_rgba(99,102,241,0.15)]`;

const ACTION_AMBER = `${ACTION_LAYOUT} border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 hover:from-amber-500/30 dark:hover:from-amber-500/30 hover:border-amber-300/40 shadow-[0_10px_30px_rgba(245,158,11,0.2)] dark:shadow-[0_10px_30px_rgba(245,158,11,0.15)]`;

const ACTION_TEAL = `${ACTION_LAYOUT} border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent dark:from-teal-500/20 dark:via-teal-500/10 hover:from-teal-500/30 dark:hover:from-teal-500/30 hover:border-teal-300/40 shadow-[0_10px_30px_rgba(20,184,166,0.2)] dark:shadow-[0_10px_30px_rgba(20,184,166,0.15)]`;

const ACTION_CYAN = `${ACTION_LAYOUT} border border-cyan-400/30 dark:border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent dark:from-cyan-500/20 dark:via-cyan-500/10 hover:from-cyan-500/30 dark:hover:from-cyan-500/30 hover:border-cyan-300/40 shadow-[0_10px_30px_rgba(6,182,212,0.2)] dark:shadow-[0_10px_30px_rgba(6,182,212,0.15)]`;

const ACTION_BLUE = `${ACTION_LAYOUT} border border-blue-400/30 dark:border-blue-400/30 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent dark:from-blue-500/20 dark:via-blue-500/10 hover:from-blue-500/30 dark:hover:from-blue-500/30 hover:border-blue-300/40 shadow-[0_10px_30px_rgba(59,130,246,0.2)] dark:shadow-[0_10px_30px_rgba(59,130,246,0.15)]`;

function withFocusRing(shell: string, hue: GlassFocusHue): string {
  return `${FOCUS_NO_LAYOUT_SHIFT_CLASS} ${GLASS_FOCUS_RING[hue]} ${shell}`;
}

/** Strong CTA — dialog submit, checkout. */
export const GLASS_PRIMARY_BUTTON: Record<GlassFocusHue, string> = {
  sky: withFocusRing(PRIMARY_SKY, "sky"),
  rose: withFocusRing(PRIMARY_ROSE, "rose"),
  emerald: withFocusRing(PRIMARY_EMERALD, "emerald"),
  violet: withFocusRing(PRIMARY_VIOLET, "violet"),
  indigo: withFocusRing(PRIMARY_INDIGO, "indigo"),
  amber: withFocusRing(PRIMARY_AMBER, "amber"),
  teal: withFocusRing(PRIMARY_TEAL, "teal"),
  cyan: withFocusRing(PRIMARY_CYAN, "cyan"),
  blue: withFocusRing(PRIMARY_BLUE, "blue"),
};

/** Toolbar — refresh, export, save. */
export const GLASS_ACTION_BUTTON: Record<GlassFocusHue, string> = {
  sky: withFocusRing(ACTION_SKY, "sky"),
  rose: withFocusRing(ACTION_ROSE, "rose"),
  emerald: withFocusRing(ACTION_EMERALD, "emerald"),
  violet: withFocusRing(ACTION_VIOLET, "violet"),
  indigo: withFocusRing(ACTION_INDIGO, "indigo"),
  amber: withFocusRing(ACTION_AMBER, "amber"),
  teal: withFocusRing(ACTION_TEAL, "teal"),
  cyan: withFocusRing(ACTION_CYAN, "cyan"),
  blue: withFocusRing(ACTION_BLUE, "blue"),
};

export function glassPrimaryButtonClass(hue: GlassFocusHue): string {
  return GLASS_PRIMARY_BUTTON[hue];
}

export function glassActionButtonClass(hue: GlassFocusHue): string {
  return GLASS_ACTION_BUTTON[hue];
}

/** Detail page footer CTA — omit variant="ghost"; readable contrast on light backgrounds (REQ-0071). */
export function glassDetailFooterButtonClass(
  hue: GlassFocusHue,
  extra?: string,
): string {
  return cn(
    GLASS_BUTTON_ICON_HOVER,
    GLASS_BUTTON_SHELL_RESET,
    GLASS_BUTTON_DISABLED,
    "group w-full sm:w-auto gap-2 !text-white",
    GLASS_PRIMARY_BUTTON[hue],
    extra,
  );
}

/** Detail page footer Back — white text parity with Edit/Duplicate CTAs (REQ-0077). */
export function glassDetailBackButtonClass(extra?: string): string {
  return cn(
    GLASS_BUTTON_ICON_HOVER,
    GLASS_BUTTON_SHELL_RESET,
    GLASS_BUTTON_DISABLED,
    "group w-full sm:w-auto gap-2 !text-white",
    GLASS_PRIMARY_BUTTON.sky,
    extra,
  );
}

/** Icon-only back control in PageSectionHeader leading slot (REQ-0072 / REQ-0126 sky glass). */
export const DETAIL_HEADER_BACK_ICON_CLASS =
  "h-10 w-10 shrink-0 self-center rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_10px_30px_rgba(2,132,199,0.25)] hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40";
