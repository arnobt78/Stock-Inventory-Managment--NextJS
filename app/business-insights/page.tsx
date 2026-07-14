import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import BusinessInsightPage from "@/components/Pages/BusinessInsightPage";
import { getProductsForUser } from "@/lib/server/home-data";
import { getOrdersForUser } from "@/lib/server/orders-data";
import { getWarehouseStockSummary } from "@/prisma/stock-allocation";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function BusinessInsightsRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialProducts, initialOrders, initialWarehouseSummary] =
    await Promise.all([
      getProductsForUser(user.id),
      getOrdersForUser(user.id),
      getWarehouseStockSummary(user.id),
    ]);

  return (
    <BusinessInsightPage
      initialProducts={initialProducts}
      initialOrders={initialOrders}
      initialWarehouseSummary={initialWarehouseSummary}
    />
  );
}
