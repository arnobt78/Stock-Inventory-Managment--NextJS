import type { AuthListHue } from "@/lib/auth/auth-panel-copy";
import { AUTH_LIST_ICON_GLASS } from "@/components/auth/auth-glass-styles";

/** Icon pill styles for auth list rows (REQ-0031; REQ-0033: glass glow wrap). */
export const AUTH_LIST_ICON_STYLES: Record<
  AuthListHue,
  { wrap: string; icon: string }
> = {
  sky: {
    wrap: AUTH_LIST_ICON_GLASS.sky,
    icon: "text-sky-600 dark:text-sky-400 drop-shadow-[0_2px_8px_rgba(14,165,233,0.35)]",
  },
  emerald: {
    wrap: AUTH_LIST_ICON_GLASS.emerald,
    icon: "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]",
  },
  amber: {
    wrap: AUTH_LIST_ICON_GLASS.amber,
    icon: "text-amber-600 dark:text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]",
  },
  violet: {
    wrap: AUTH_LIST_ICON_GLASS.violet,
    icon: "text-violet-600 dark:text-violet-400 drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)]",
  },
  blue: {
    wrap: AUTH_LIST_ICON_GLASS.blue,
    icon: "text-blue-600 dark:text-blue-400 drop-shadow-[0_2px_8px_rgba(59,130,246,0.35)]",
  },
};
