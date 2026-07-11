import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import WarehousesPage from "@/components/Pages/WarehousesPage";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import { getWarehouseStockSummary } from "@/prisma/stock-allocation";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function WarehousesRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialWarehouses, listStats, initialWarehouseSummary] =
    await Promise.all([
      getWarehousesForUser(user.id),
      prefetchListPageStats(user),
      getWarehouseStockSummary(user.id),
    ]);
  return (
    <WarehousesPage
      initialWarehouses={initialWarehouses}
      initialStats={listStats.initialStats}
      initialWarehouseSummary={initialWarehouseSummary}
    />
  );
}
