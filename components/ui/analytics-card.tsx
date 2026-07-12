import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import { TYPO_STAT_VALUE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";

/**
 * Color variant types for analytics cards (matching StatisticsCard)
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconColor?: string;
  variant?: CardVariant;
  /** When true, value shows inline pulse (title/icon stay visible — REQ-0021) */
  valueLoading?: boolean;
}

/**
 * Color configuration for each variant - glassmorphic style
 */
const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
  }
> = {
  sky: {
    border: "border-sky-400/30",
    gradient: "bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(2,132,199,0.25)] dark:shadow-[0_20px_50px_rgba(2,132,199,0.15)]",
    hoverBorder: "hover:border-sky-300/50",
  },
  emerald: {
    border: "border-emerald-400/30",
    gradient:
      "bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(16,185,129,0.25)] dark:shadow-[0_20px_50px_rgba(16,185,129,0.15)]",
    hoverBorder: "hover:border-emerald-300/50",
  },
  amber: {
    border: "border-amber-400/30",
    gradient:
      "bg-gradient-to-br from-amber-500/30 via-amber-500/15 to-amber-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(245,158,11,0.2)] dark:shadow-[0_20px_50px_rgba(245,158,11,0.12)]",
    hoverBorder: "hover:border-amber-300/60",
  },
  rose: {
    border: "border-rose-400/30",
    gradient:
      "bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-rose-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(225,29,72,0.25)] dark:shadow-[0_20px_50px_rgba(225,29,72,0.15)]",
    hoverBorder: "hover:border-rose-300/50",
  },
  violet: {
    border: "border-violet-400/30",
    gradient:
      "bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-violet-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(139,92,246,0.25)] dark:shadow-[0_20px_50px_rgba(139,92,246,0.15)]",
    hoverBorder: "hover:border-violet-300/50",
  },
  blue: {
    border: "border-blue-400/30",
    gradient:
      "bg-gradient-to-br from-blue-500/25 via-blue-500/10 to-blue-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(59,130,246,0.25)] dark:shadow-[0_20px_50px_rgba(59,130,246,0.15)]",
    hoverBorder: "hover:border-blue-300/50",
  },
  orange: {
    border: "border-orange-400/30",
    gradient:
      "bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-orange-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(249,115,22,0.25)] dark:shadow-[0_20px_50px_rgba(249,115,22,0.15)]",
    hoverBorder: "hover:border-orange-300/50",
  },
  teal: {
    border: "border-teal-400/30",
    gradient:
      "bg-gradient-to-br from-teal-500/25 via-teal-500/10 to-teal-500/5",
    shadow:
      "shadow-[0_20px_50px_rgba(20,184,166,0.25)] dark:shadow-[0_20px_50px_rgba(20,184,166,0.15)]",
    hoverBorder: "hover:border-teal-300/50",
  },
};

export function AnalyticsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconColor = "text-gray-700 dark:text-white",
  variant = "blue",
  valueLoading = false,
}: AnalyticsCardProps) {
  const config = variantConfig[variant];

  return (
    <article
      className={cn(
        "group rounded-[20px] border min-h-[140px] h-full p-4 sm:p-5 backdrop-blur-md transition",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-700 dark:text-white/60 font-medium shrink-0">
            {title}
          </p>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300/30 bg-gray-100/50 shadow-inner shadow-primary/20 backdrop-blur dark:border-white/15 dark:bg-white/10">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
        <p className={TYPO_STAT_VALUE}>
          {valueLoading ? <DataSlotPulse variant="metric" /> : value}
        </p>
        {description && (
          <p className={cn("mt-2", TYPO_SUBTITLE)}>{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500 dark:text-white/60 ml-1">
              from last month
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
