import { getSession } from "@/lib/auth-server";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import AdminDashboardMergedView from "@/components/admin/AdminDashboardMergedView";

/**
 * Store Dashboard & Analytics — overview (KPIs + recent orders) + full analytics.
 * Store-wide data (own + client activity). Layout from app/admin/layout.tsx.
 */
export const dynamic = "force-dynamic";

export default async function StoreDashboardPage() {
  const user = await getSession();
  if (!user) return null;
  const initialStats = await getDashboardForAdmin(user.id);
  return (
    <AdminDashboardMergedView
      variant="store"
      initialStats={initialStats}
    />
  );
}
