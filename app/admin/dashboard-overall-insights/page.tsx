import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import AdminDashboardMergedView from "@/components/admin/AdminDashboardMergedView";

/**
 * Store Dashboard & Analytics — overview (KPIs + recent orders) + full analytics.
 * REQ-0021 — session shell + Suspense-streamed dashboard stats.
 */
export const dynamic = "force-dynamic";

export default async function StoreDashboardPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminDashboardMergedView variant="store" />}>
      <StoreDashboardWithData userId={user.id} />
    </Suspense>
  );
}

async function StoreDashboardWithData({ userId }: { userId: string }) {
  const initialStats = await getDashboardForAdmin(userId);
  return (
    <AdminDashboardMergedView variant="store" initialStats={initialStats} />
  );
}
