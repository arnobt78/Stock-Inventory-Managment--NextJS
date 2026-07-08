"use client";

import React from "react";
import HistoryList from "./HistoryList";
import ActivityLogSection from "./ActivityLogSection";
import { PageContentWrapper } from "@/components/shared";
import type { ImportHistoryForPage, AuditLog } from "@/types";

export type AdminHistoryContentProps = {
  initialHistory?: ImportHistoryForPage[];
  initialActivityLogs?: AuditLog[];
  /** Base path for detail links (e.g. "/admin/activity-history") */
  detailHrefBase?: string;
};

/**
 * Admin History section — import history list + activity log (CRUD) with period filter.
 */
export default function AdminHistoryContent({
  initialHistory,
  initialActivityLogs,
  detailHrefBase = "/admin/activity-history",
}: AdminHistoryContentProps = {}) {
  return (
    <PageContentWrapper>
      <HistoryList
        detailHrefBase={detailHrefBase}
        initialHistory={initialHistory}
      />
      <ActivityLogSection
        initialLogs={initialActivityLogs}
        initialPeriod="7days"
      />
    </PageContentWrapper>
  );
}
