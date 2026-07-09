import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import HomePage from "@/components/Pages/HomePage";
import {
  getProductsForUser,
  getCategoriesForUser,
  getSuppliersForUser,
} from "@/lib/server/home-data";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash on refresh). */
export const dynamic = "force-dynamic";

export default async function HomeRoute({
  searchParams,
}: {
  searchParams: Promise<{ oauth_success?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "client") redirect("/client");
  if (user.role === "supplier") redirect("/supplier");

  const params = await searchParams;
  const initialOAuthSuccess = params.oauth_success === "true";

  const [products, categories, suppliers, stats] = await Promise.all([
    getProductsForUser(user.id),
    getCategoriesForUser(user.id),
    getSuppliersForUser(user.id),
    getDashboardForAdmin(user.id),
  ]);

  return (
    <HomePage
      initialProducts={products}
      initialCategories={categories}
      initialSuppliers={suppliers}
      initialStats={stats}
      initialOAuthSuccess={initialOAuthSuccess}
    />
  );
}
