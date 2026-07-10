/**
 * REQ-0046 — focus styles without border-width change (prevents toolbar/input shift).
 * Rings use box-shadow only; never grow border width on focus.
 */

/** Suppress outline and ring-offset; never use focus:border-2 or bare focus-visible:border. */
export const FOCUS_NO_LAYOUT_SHIFT_CLASS =
  "focus:outline-none focus-visible:outline-none focus:ring-offset-0 data-[state=open]:outline-none";

/** Default primitive ring when no feature hue is set (Input/Select/Textarea). */
export const FOCUS_VISIBLE_NEUTRAL_RING_CLASS =
  "focus-visible:ring-2 focus-visible:ring-ring/50 dark:focus-visible:ring-white/35";

export type GlassFocusHue =
  | "sky"
  | "rose"
  | "emerald"
  | "violet"
  | "indigo"
  | "amber"
  | "teal"
  | "cyan"
  | "blue";

/** Hue-matched keyboard ring — visible in dark mode; no layout shift. */
export const GLASS_FOCUS_RING: Record<GlassFocusHue, string> = {
  sky: "focus-visible:ring-2 focus-visible:ring-sky-500/50 dark:focus-visible:ring-sky-400/70",
  rose: "focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:focus-visible:ring-rose-400/70",
  emerald:
    "focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/70",
  violet:
    "focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:focus-visible:ring-violet-400/70",
  indigo:
    "focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:focus-visible:ring-indigo-400/70",
  amber:
    "focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:focus-visible:ring-amber-400/70",
  teal: "focus-visible:ring-2 focus-visible:ring-teal-500/50 dark:focus-visible:ring-teal-400/70",
  cyan: "focus-visible:ring-2 focus-visible:ring-cyan-500/50 dark:focus-visible:ring-cyan-400/70",
  blue: "focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/70",
};

/** Compose glass field shell + no-shift + hue ring (dialog/form inputs). */
export function glassFormFieldClasses(
  hue: GlassFocusHue,
  shell: string,
): string {
  return `${shell} ${FOCUS_NO_LAYOUT_SHIFT_CLASS} ${GLASS_FOCUS_RING[hue]}`;
}
