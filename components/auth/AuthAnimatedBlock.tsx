"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthAnimatedBlockProps = {
  children: ReactNode;
  className?: string;
  /** animation-delay in ms */
  delayMs?: number;
};

/**
 * REQ-0030 — CSS-only entrance wrapper for auth pages.
 * Uses .auth-enter from globals.css; safe for SSR (same markup server/client).
 */
export function AuthAnimatedBlock({
  children,
  className,
  delayMs = 0,
}: AuthAnimatedBlockProps) {
  const style: CSSProperties = { animationDelay: `${delayMs}ms` };

  return (
    <div className={cn("auth-enter", className)} style={style}>
      {children}
    </div>
  );
}
