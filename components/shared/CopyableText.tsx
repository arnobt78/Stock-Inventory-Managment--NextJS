"use client";

/**
 * CopyableText — inline copy-to-clipboard wrapper for identifiers
 * (order numbers, invoice numbers, SKUs, …).
 *
 * Renders children (the visible value) followed by a small Copy icon button.
 * Click → navigator.clipboard.writeText(value) → Check icon for ~1.5s.
 * Safe inside <Link> table cells: the icon click stops propagation and
 * prevents default so the row link does not navigate.
 *
 * Usage:
 *   <CopyableText value={order.orderNumber}>{order.orderNumber}</CopyableText>
 */

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyableTextProps {
  /** Raw text written to the clipboard */
  value: string;
  /** Visible content (usually the same text, possibly styled/linked) */
  children: React.ReactNode;
  /** Class for the outer inline-flex wrapper */
  className?: string;
  /** Class for the icon button (size/color overrides) */
  iconClassName?: string;
  /** Accessible label; defaults to "Copy {value}" */
  ariaLabel?: string;
}

export function CopyableText({
  value,
  children,
  className,
  iconClassName,
  ariaLabel,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending timer on unmount so setCopied never fires on a dead component
  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = async (event: React.MouseEvent) => {
    // Keep row/anchor navigation from firing when the icon lives inside a Link
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — fail silently
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-1 min-w-0", className)}>
      {children}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel ?? `Copy ${value}`}
        className={cn(
          "shrink-0 rounded p-0.5 transition-colors",
          "text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200",
          "hover:bg-gray-200/50 dark:hover:bg-white/10",
          iconClassName,
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </span>
  );
}
