"use client";

import React from "react";
import { PageContentWrapper } from "@/components/shared";
import AdminAnalyticsContent from "./AdminAnalyticsContent";
import type { DashboardStats } from "@/types";

export type AdminDashboardMergedViewProps = {
  variant: "store" | "personal";
  /** SSR-passed dashboard stats; omitted in Suspense fallback shell (REQ-0021) */
  initialStats?: DashboardStats | null;
};

/**
 * Merged dashboard: overview (KPIs + recent orders) + analytics (charts, AI).
 * REQ-0021 — shell-first fallback renders layout before streamed stats arrive.
 */
export default function AdminDashboardMergedView({
  variant,
  initialStats,
}: AdminDashboardMergedViewProps) {
  return (
    <PageContentWrapper noPadding={variant === "store"}>
      <div className="space-y-4">
        <AdminAnalyticsContent initialStats={initialStats} />
      </div>
    </PageContentWrapper>
  );
}
