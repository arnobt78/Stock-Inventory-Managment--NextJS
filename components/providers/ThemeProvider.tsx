"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * next-themes injects an inline `<script>` to set the theme before paint (no FOUC).
 * React 19 / Next 16.2+ warn that scripts inside components never execute on the
 * client — false positive here: the script runs from the SSR HTML stream.
 * Filter that specific console.error in development only (shadcn dark-mode guide).
 * REQ-0144
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return;
    }
    orig.apply(console, args as Parameters<typeof console.error>);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
