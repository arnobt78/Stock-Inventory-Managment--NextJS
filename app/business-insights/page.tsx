import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import BusinessInsightPage from "@/components/Pages/BusinessInsightPage";
import { getProductsForUser } from "@/lib/server/home-data";
import { getOrdersForUser } from "@/lib/server/orders-data";

/** REQ-0021 — session shell + Suspense-streamed business insights data */
export default async function BusinessInsightsRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<BusinessInsightPage />}>
      <BusinessInsightPageWithData userId={user.id} />
    </Suspense>
  );
}

async function BusinessInsightPageWithData({ userId }: { userId: string }) {
  const [initialProducts, initialOrders] = await Promise.all([
    getProductsForUser(userId),
    getOrdersForUser(userId),
  ]);

  return (
    <BusinessInsightPage
      initialProducts={initialProducts}
      initialOrders={initialOrders}
    />
  );
}
