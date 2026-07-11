import { getSession } from "@/lib/auth-server";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import AdminWarehousesContent from "@/components/admin/AdminWarehousesContent";
import { getWarehouseStockSummary } from "@/prisma/stock-allocation";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminWarehousesPage() {
  const user = await getSession();
  if (!user) return null;

  const [initialWarehouses, listStats, initialWarehouseSummary] =
    await Promise.all([
      getWarehousesForUser(user.id),
      prefetchListPageStats(user),
      getWarehouseStockSummary(user.id),
    ]);
  return (
    <AdminWarehousesContent
      initialWarehouses={initialWarehouses}
      initialStats={listStats.initialStats}
      initialWarehouseSummary={initialWarehouseSummary}
    />
  );
}
