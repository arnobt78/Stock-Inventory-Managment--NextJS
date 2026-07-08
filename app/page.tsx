import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import HomePage from "@/components/Pages/HomePage";
import {
  getProductsForUser,
  getCategoriesForUser,
  getSuppliersForUser,
} from "@/lib/server/home-data";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";

/** REQ-0021 — session shell + Suspense-streamed home data */
export default async function HomeRoute({
  searchParams,
}: {
  searchParams: Promise<{ oauth_success?: string }>;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "client") {
    redirect("/client");
  }
  if (user.role === "supplier") {
    redirect("/supplier");
  }

  const params = await searchParams;
  const initialOAuthSuccess = params.oauth_success === "true";

  return (
    <Suspense fallback={<HomePage initialOAuthSuccess={initialOAuthSuccess} />}>
      <HomePageWithData
        userId={user.id}
        initialOAuthSuccess={initialOAuthSuccess}
      />
    </Suspense>
  );
}

async function HomePageWithData({
  userId,
  initialOAuthSuccess,
}: {
  userId: string;
  initialOAuthSuccess: boolean;
}) {
  const [products, categories, suppliers, stats] = await Promise.all([
    getProductsForUser(userId),
    getCategoriesForUser(userId),
    getSuppliersForUser(userId),
    getDashboardForAdmin(userId),
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
