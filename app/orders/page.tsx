import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import OrdersPage from "@/components/Pages/OrdersPage";
import {
  getOrdersForUser,
  getOrdersForClientId,
  getOrdersForSupplierId,
} from "@/lib/server/orders-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import { getSupplierByUserId } from "@/prisma/supplier";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function OrdersRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const userRole = user.role ?? undefined;
  const listStatsPromise = prefetchListPageStats(user);

  let initialOrders;
  if (userRole === "client") {
    const [orders, listStats] = await Promise.all([
      getOrdersForClientId(user.id),
      listStatsPromise,
    ]);
    return (
      <OrdersPage
        initialOrders={orders}
        userRole={userRole}
        initialClientPortal={listStats.initialClientPortal}
      />
    );
  }
  if (userRole === "supplier") {
    const supplier = await getSupplierByUserId(user.id);
    const [orders, listStats] = await Promise.all([
      supplier ? getOrdersForSupplierId(supplier.id) : Promise.resolve([]),
      listStatsPromise,
    ]);
    return (
      <OrdersPage
        initialOrders={orders}
        userRole={userRole}
        initialSupplierPortal={listStats.initialSupplierPortal}
      />
    );
  }

  const [initialOrdersResult, listStats] = await Promise.all([
    getOrdersForUser(user.id),
    listStatsPromise,
  ]);

  return (
    <OrdersPage
      initialOrders={initialOrdersResult}
      userRole={userRole}
      initialStats={listStats.initialStats}
    />
  );
}
