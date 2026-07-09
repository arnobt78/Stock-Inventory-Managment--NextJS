import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import CategoriesPage from "@/components/Pages/CategoriesPage";
import { getCategoriesForUser } from "@/lib/server/home-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function CategoriesRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialCategories, listStats] = await Promise.all([
    getCategoriesForUser(user.id),
    prefetchListPageStats(user),
  ]);
  return (
    <CategoriesPage
      initialCategories={initialCategories}
      initialStats={listStats.initialStats}
    />
  );
}
