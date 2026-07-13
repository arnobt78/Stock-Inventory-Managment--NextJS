import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import {
  getOrdersForUser,
  getClientOrdersForProductOwner,
} from "@/lib/server/orders-data";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import AdminCombinedOrdersContent from "@/components/admin/AdminCombinedOrdersContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash, no double client fetch). */
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialOrders, initialClientOrders, initialStats] = await Promise.all([
    getOrdersForUser(user.id),
    getClientOrdersForProductOwner(user.id),
    getDashboardForAdmin(user.id),
  ]);

  return (
    <AdminCombinedOrdersContent
      initialOrders={initialOrders}
      initialClientOrders={initialClientOrders}
      initialStats={initialStats}
    />
  );
}
