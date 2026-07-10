"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  AUTH_FORM_GLASS,
  type AuthGlassVariant,
} from "@/components/auth/auth-glass-styles";

type AuthFormCardProps = {
  variant: AuthGlassVariant;
  children: ReactNode;
  className?: string;
};

/**
 * REQ-0032 — shared frosted glass wrapper for login/register form column.
 * Uses backdrop-blur-2xl to match navbar glass intensity.
 */
export function AuthFormCard({
  variant,
  children,
  className,
}: AuthFormCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-[28px] p-4 sm:p-6",
        AUTH_FORM_GLASS[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
