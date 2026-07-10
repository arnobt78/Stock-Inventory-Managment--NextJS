import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Base stagger step between auth entrance blocks (ms). REQ-0030 */
export const AUTH_STAGGER_MS = 80;

/** Form column starts slightly after first promo card. */
export const AUTH_FORM_STAGGER_BASE = 120;

/** Inner form row stagger step (ms). */
export const AUTH_FORM_ROW_STAGGER_MS = 60;

/** CSS class + inline delay for auth page entrance animations. */
export function authEnterStyle(staggerIndex: number, baseMs = 0): {
  className: string;
  style: CSSProperties;
} {
  return {
    className: "auth-enter",
    style: { animationDelay: `${baseMs + staggerIndex * AUTH_STAGGER_MS}ms` },
  };
}

/** Form inner rows use a tighter stagger from a shared base offset. */
export function authFormRowStyle(rowIndex: number, baseMs = AUTH_FORM_STAGGER_BASE): {
  className: string;
  style: CSSProperties;
} {
  return {
    className: cn("auth-enter"),
    style: {
      animationDelay: `${baseMs + rowIndex * AUTH_FORM_ROW_STAGGER_MS}ms`,
    },
  };
}
