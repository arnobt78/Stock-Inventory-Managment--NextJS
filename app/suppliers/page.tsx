import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import SuppliersPage from "@/components/Pages/SuppliersPage";
import { getSuppliersForUser } from "@/lib/server/home-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function SuppliersRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialSuppliers, listStats] = await Promise.all([
    getSuppliersForUser(user.id),
    prefetchListPageStats(user),
  ]);
  return (
    <SuppliersPage
      initialSuppliers={initialSuppliers}
      initialStats={listStats.initialStats}
    />
  );
}
