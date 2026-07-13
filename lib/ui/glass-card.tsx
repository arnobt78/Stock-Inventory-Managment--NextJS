/**
 * REQ-0096 — shared glassmorphic card shell + body padding token.
 * shell: article border/gradient/shadow only (detail pages wrap children in GlassCardBody).
 * body: article includes p-2 sm:p-4 (order detail cards without inner wrapper).
 */

import React from "react";
import { cn } from "@/lib/utils";

export type GlassCardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "rose"
  | "cyan";

/** @deprecated Use GlassCardVariant — kept for order-detail barrel compat */
export type CardVariant = GlassCardVariant;

export const GLASS_CARD_VARIANT_CONFIG: Record<
  GlassCardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = {
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
    hoverBorder: "hover:border-sky-300/40",
    iconBg: "border-sky-300/30 bg-sky-100/50",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient:
      "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)]",
    hoverBorder: "hover:border-emerald-300/40",
    iconBg: "border-emerald-300/30 bg-emerald-100/50",
  },
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    hoverBorder: "hover:border-amber-300/40",
    iconBg: "border-amber-300/30 bg-amber-100/50",
  },
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
    hoverBorder: "hover:border-violet-300/40",
    iconBg: "border-violet-300/30 bg-violet-100/50",
  },
  blue: {
    border: "border-blue-400/20",
    gradient:
      "bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(59,130,246,0.15)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.1)]",
    hoverBorder: "hover:border-blue-300/40",
    iconBg: "border-blue-300/30 bg-blue-100/50",
  },
  orange: {
    border: "border-orange-400/20",
    gradient:
      "bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(249,115,22,0.15)] dark:shadow-[0_15px_40px_rgba(249,115,22,0.1)]",
    hoverBorder: "hover:border-orange-300/40",
    iconBg: "border-orange-300/30 bg-orange-100/50",
  },
  teal: {
    border: "border-teal-400/20",
    gradient:
      "bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(20,184,166,0.15)] dark:shadow-[0_15px_40px_rgba(20,184,166,0.1)]",
    hoverBorder: "hover:border-teal-300/40",
    iconBg: "border-teal-300/30 bg-teal-100/50",
  },
  rose: {
    border: "border-rose-400/20",
    gradient:
      "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(225,29,72,0.15)] dark:shadow-[0_15px_40px_rgba(225,29,72,0.1)]",
    hoverBorder: "hover:border-rose-300/40",
    iconBg: "border-rose-300/30 bg-rose-100/50",
  },
  cyan: {
    border: "border-cyan-400/20",
    gradient:
      "bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(6,182,212,0.15)] dark:shadow-[0_15px_40px_rgba(6,182,212,0.1)]",
    hoverBorder: "hover:border-cyan-300/40",
    iconBg: "border-cyan-300/30 bg-cyan-100/50",
  },
};

/** @deprecated Use GLASS_CARD_VARIANT_CONFIG */
export const variantConfig = GLASS_CARD_VARIANT_CONFIG;

export type GlassCardProps = {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  className?: string;
  /** shell = no article padding; body = p-2 sm:p-4 on article */
  padding?: "shell" | "body";
};

export function GlassCard({
  children,
  variant = "blue",
  className,
  padding = "shell",
}: GlassCardProps) {
  const config = GLASS_CARD_VARIANT_CONFIG[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border backdrop-blur-md transition-all duration-300 overflow-hidden",
        padding === "body" && "p-2 sm:p-4 bg-white/60 dark:bg-white/5",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Canonical inner padding for shell-mode GlassCard (REQ-0095). */
export function GlassCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-2 sm:p-4", className)}>{children}</div>;
}
