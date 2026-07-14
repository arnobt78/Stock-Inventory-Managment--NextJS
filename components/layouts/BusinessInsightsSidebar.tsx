"use client";

import React from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Business Insights sidebar: grouped header + Overview, Distribution, Trends, Alerts.
 * Same style as AdminSidebar (section titles + nav items). Controls the tab via value and onValueChange.
 */

const TAB_ITEMS: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "distribution", label: "Distribution", icon: PieChartIcon },
  { value: "trends", label: "Trends", icon: TrendingUp },
  { value: "warehouses", label: "Warehouses", icon: Warehouse },
  { value: "alerts", label: "Alerts", icon: AlertTriangle },
];

export interface BusinessInsightsSidebarProps {
  value: string;
  onValueChange: (value: string) => void;
  /** When true, render icon-only compact sidebar for phone screens */
  collapsed?: boolean;
}

export default function BusinessInsightsSidebar({
  value,
  onValueChange,
  collapsed = false,
}: BusinessInsightsSidebarProps) {
  if (collapsed) {
    return (
      <nav
        className="flex min-h-0 flex-col items-center px-2 gap-1"
        aria-label="Insights sections"
      >
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onValueChange(item.value)}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex items-center justify-center rounded-lg w-9 h-9 transition-colors",
                isActive
                  ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className="flex min-h-0 flex-col p-2 gap-1"
      aria-label="Insights sections"
    >
      {/* Grouped header — same style as AdminSidebar */}
      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        Product & Business Insights
      </p>
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg pl-8 pr-3 py-2 text-left text-sm font-normal transition-colors w-full",
              isActive
                ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10",
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
