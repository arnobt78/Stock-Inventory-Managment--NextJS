/**
 * Floating action button gradients — pre-REQ-0047 visible style (text-white, strong glow).
 */
import { cn } from "@/lib/utils";
import type { GlassFocusHue } from "@/lib/ui/focus-ring-styles";

const FAB_BASE =
  "h-14 rounded-full flex items-center justify-center gap-2 text-white font-normal backdrop-blur-md transition-all duration-300 shadow-none hover:shadow-none";

const FAB_BY_HUE: Record<GlassFocusHue, string> = {
  rose: "border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 dark:from-rose-500/70 dark:via-rose-500/50 dark:to-rose-500/30 shadow-[0_15px_35px_rgba(225,29,72,0.45)] hover:border-rose-300/40 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40 hover:shadow-[0_20px_45px_rgba(225,29,72,0.6)]",
  sky: "border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 shadow-[0_15px_35px_rgba(2,132,199,0.45)] hover:border-sky-300/40 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)]",
  emerald:
    "border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 dark:from-emerald-500/70 dark:via-emerald-500/50 dark:to-emerald-500/30 shadow-[0_15px_35px_rgba(16,185,129,0.45)] hover:border-emerald-300/40 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40 hover:shadow-[0_20px_45px_rgba(16,185,129,0.6)]",
  violet:
    "border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 shadow-[0_15px_35px_rgba(139,92,246,0.45)] hover:border-violet-300/40 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 hover:shadow-[0_20px_45px_rgba(139,92,246,0.6)]",
  indigo:
    "border border-indigo-400/30 dark:border-indigo-400/30 bg-gradient-to-r from-indigo-500/70 via-indigo-500/50 to-indigo-500/30 dark:from-indigo-500/70 dark:via-indigo-500/50 dark:to-indigo-500/30 shadow-[0_15px_35px_rgba(99,102,241,0.45)] hover:border-indigo-300/40 hover:from-indigo-500/80 hover:via-indigo-500/60 hover:to-indigo-500/40 hover:shadow-[0_20px_45px_rgba(99,102,241,0.6)]",
  amber:
    "border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/70 via-amber-500/50 to-amber-500/30 dark:from-amber-500/70 dark:via-amber-500/50 dark:to-amber-500/30 shadow-[0_15px_35px_rgba(245,158,11,0.45)] hover:border-amber-300/40 hover:from-amber-500/80 hover:via-amber-500/60 hover:to-amber-500/40 hover:shadow-[0_20px_45px_rgba(245,158,11,0.6)]",
  teal: "border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/70 via-teal-500/50 to-teal-500/30 dark:from-teal-500/70 dark:via-teal-500/50 dark:to-teal-500/30 shadow-[0_15px_35px_rgba(20,184,166,0.45)] hover:border-teal-300/40 hover:from-teal-500/80 hover:via-teal-500/60 hover:to-teal-500/40 hover:shadow-[0_20px_45px_rgba(20,184,166,0.6)]",
  cyan: "border border-cyan-400/30 dark:border-cyan-400/30 bg-gradient-to-r from-cyan-500/70 via-cyan-500/50 to-cyan-500/30 dark:from-cyan-500/70 dark:via-cyan-500/50 dark:to-cyan-500/30 shadow-[0_15px_35px_rgba(6,182,212,0.45)] hover:border-cyan-300/40 hover:from-cyan-500/80 hover:via-cyan-500/60 hover:to-cyan-500/40 hover:shadow-[0_20px_45px_rgba(6,182,212,0.6)]",
  blue: "border border-blue-400/30 dark:border-blue-400/30 bg-gradient-to-r from-blue-500/70 via-blue-500/50 to-blue-500/30 dark:from-blue-500/70 dark:via-blue-500/50 dark:to-blue-500/30 shadow-[0_15px_35px_rgba(59,130,246,0.45)] hover:border-blue-300/40 hover:from-blue-500/80 hover:via-blue-500/60 hover:to-blue-500/40 hover:shadow-[0_20px_45px_rgba(59,130,246,0.6)]",
};

export function fabButtonClass(hue: GlassFocusHue, expanded: boolean): string {
  return cn(
    FAB_BASE,
    FAB_BY_HUE[hue],
    expanded ? "w-auto px-4" : "w-14 px-0",
  );
}
