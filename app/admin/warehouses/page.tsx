import { getSession } from "@/lib/auth-server";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import AdminWarehousesContent from "@/components/admin/AdminWarehousesContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminWarehousesPage() {
  const user = await getSession();
  if (!user) return null;

  const [initialWarehouses, listStats] = await Promise.all([
    getWarehousesForUser(user.id),
    prefetchListPageStats(user),
  ]);
  return (
    <AdminWarehousesContent
      initialWarehouses={initialWarehouses}
      initialStats={listStats.initialStats}
    />
  );
}
