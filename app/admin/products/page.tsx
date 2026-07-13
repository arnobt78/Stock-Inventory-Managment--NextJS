import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getProductsForUser } from "@/lib/server/home-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import AdminProductsContent from "@/components/admin/AdminProductsContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialProducts, listStats] = await Promise.all([
    getProductsForUser(user.id),
    prefetchListPageStats(user),
  ]);
  return (
    <AdminProductsContent
      initialProducts={initialProducts}
      initialStats={listStats.initialStats}
      initialSupplierPortal={listStats.initialSupplierPortal}
    />
  );
}
