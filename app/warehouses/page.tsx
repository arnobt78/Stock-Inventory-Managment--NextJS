import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import WarehousesPage from "@/components/Pages/WarehousesPage";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function WarehousesRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialWarehouses, listStats] = await Promise.all([
    getWarehousesForUser(user.id),
    prefetchListPageStats(user),
  ]);
  return (
    <WarehousesPage
      initialWarehouses={initialWarehouses}
      initialStats={listStats.initialStats}
    />
  );
}
