import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";

export type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "rose";

export const variantConfig: Record<
  CardVariant,
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
};

export function GlassCard({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-md transition-all duration-300",
        "bg-white/60 dark:bg-white/5",
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

export function formatAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "N/A";
  const addr = address as Record<string, unknown>;
  const parts: string[] = [];
  if (addr.street) parts.push(String(addr.street));
  if (addr.city) parts.push(String(addr.city));
  if (addr.state) parts.push(String(addr.state));
  if (addr.zipCode) parts.push(String(addr.zipCode));
  if (addr.country) parts.push(String(addr.country));
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

export function getCustomerDisplay(order: {
  shippingAddress?: unknown;
  placedByName?: string | null;
}): string {
  const addr = order.shippingAddress as
    | { name?: string; email?: string }
    | null
    | undefined;
  if (addr?.name) return addr.name;
  if (addr?.email) return addr.email;
  if (order.placedByName) return order.placedByName;
  return "—";
}

export function getCustomerEmail(order: {
  shippingAddress?: unknown;
  placedByEmail?: string | null;
}): string {
  const addr = order.shippingAddress as { email?: string } | null | undefined;
  if (addr?.email) return addr.email;
  if (order.placedByEmail) return order.placedByEmail;
  return "—";
}

type DetailInfoTone = CardVariant;

const detailInfoToneClasses: Record<
  DetailInfoTone,
  { icon: string; row: string }
> = {
  orange: {
    icon: "text-orange-500 dark:text-orange-400",
    row: "from-orange-100/50 via-orange-50/30 to-transparent dark:from-orange-500/10 dark:via-orange-500/5 dark:to-transparent border-orange-200/30 dark:border-orange-400/10",
  },
  amber: {
    icon: "text-amber-500 dark:text-amber-400",
    row: "from-amber-100/50 via-amber-50/30 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border-amber-200/30 dark:border-amber-400/10",
  },
  sky: {
    icon: "text-sky-500 dark:text-sky-400",
    row: "from-sky-100/50 via-sky-50/30 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 dark:to-transparent border-sky-200/30 dark:border-sky-400/10",
  },
  emerald: {
    icon: "text-emerald-500 dark:text-emerald-400",
    row: "from-emerald-100/50 via-emerald-50/30 to-transparent dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-transparent border-emerald-200/30 dark:border-emerald-400/10",
  },
  violet: {
    icon: "text-violet-500 dark:text-violet-400",
    row: "from-violet-100/50 via-violet-50/30 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border-violet-200/30 dark:border-violet-400/10",
  },
  blue: {
    icon: "text-blue-500 dark:text-blue-400",
    row: "from-blue-100/50 via-blue-50/30 to-transparent dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent border-blue-200/30 dark:border-blue-400/10",
  },
  teal: {
    icon: "text-teal-500 dark:text-teal-400",
    row: "from-teal-100/50 via-teal-50/30 to-transparent dark:from-teal-500/10 dark:via-teal-500/5 dark:to-transparent border-teal-200/30 dark:border-teal-400/10",
  },
  rose: {
    icon: "text-rose-500 dark:text-rose-400",
    row: "from-rose-100/50 via-rose-50/30 to-transparent dark:from-rose-500/10 dark:via-rose-500/5 dark:to-transparent border-rose-200/30 dark:border-rose-400/10",
  },
};

/** REQ-0071 — icon + label + value row for detail information cards. */
export function DetailInfoRow({
  icon: Icon,
  label,
  children,
  tone = "orange",
  loading,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  tone?: DetailInfoTone;
  loading?: boolean;
}) {
  const styles = detailInfoToneClasses[tone];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm p-2 rounded-xl bg-gradient-to-r border",
        styles.row,
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", styles.icon)} />
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 dark:text-white">
        {loading ? (
          <DataSlotPulse variant="text-sm" className="w-24" />
        ) : (
          children
        )}
      </span>
    </div>
  );
}
