import { getSession } from "@/lib/auth-server";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import { getForecastingForUser } from "@/lib/server/forecasting-data";
import AdminDashboardMergedView from "@/components/admin/AdminDashboardMergedView";

/** Store Dashboard & Analytics — blocking SSR (REQ-0025, no Suspense flash). */
export const dynamic = "force-dynamic";

export default async function StoreDashboardPage() {
  const user = await getSession();
  if (!user) return null;

  const [initialStats, initialForecasting] = await Promise.all([
    getDashboardForAdmin(user.id),
    getForecastingForUser(user.id),
  ]);

  return (
    <AdminDashboardMergedView
      variant="store"
      initialStats={initialStats}
      initialForecasting={initialForecasting}
    />
  );
}
