"use client";

import React from "react";
import { PageContentWrapper } from "@/components/shared";
import AdminAnalyticsContent from "./AdminAnalyticsContent";
import type { DashboardStats } from "@/types";

export type AdminDashboardMergedViewProps = {
  variant: "store" | "personal";
  /** SSR-passed dashboard stats (REQ-0021) */
  initialStats?: DashboardStats | null;
  /** SSR-passed forecasting summary (REQ-0025) */
  initialForecasting?: import("@/types").ForecastingSummary;
};

/**
 * Merged dashboard: overview (KPIs + recent orders) + analytics (charts, AI).
 * REQ-0025 — blocking SSR in page.tsx; no Suspense shell flash.
 */
export default function AdminDashboardMergedView({
  variant,
  initialStats,
  initialForecasting,
}: AdminDashboardMergedViewProps) {
  return (
    <PageContentWrapper noPadding={variant === "store"}>
      <div className="space-y-4">
        <AdminAnalyticsContent
          initialStats={initialStats}
          initialForecasting={initialForecasting}
        />
      </div>
    </PageContentWrapper>
  );
}
