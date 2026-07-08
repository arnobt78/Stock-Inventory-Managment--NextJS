import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import {
  getHistoryForUser,
  getActivityLogsForPage,
} from "@/lib/server/history-data";
import AdminHistoryContent from "@/components/admin/AdminHistoryContent";

/**
 * Admin Activity History — import history + activity log (CRUD) with date filters.
 * REQ-0021 — session shell + Suspense-streamed history data.
 */
export default async function AdminActivityHistoryPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense
      fallback={
        <AdminHistoryContent detailHrefBase="/admin/activity-history" />
      }
    >
      <AdminActivityHistoryPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminActivityHistoryPageWithData({ userId }: { userId: string }) {
  const [initialHistory, initialActivityLogs] = await Promise.all([
    getHistoryForUser(userId),
    getActivityLogsForPage("7days", userId),
  ]);

  return (
    <AdminHistoryContent
      initialHistory={initialHistory}
      initialActivityLogs={initialActivityLogs}
      detailHrefBase="/admin/activity-history"
    />
  );
}
