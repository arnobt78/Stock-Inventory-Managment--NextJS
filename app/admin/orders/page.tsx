import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { getOrdersForUser } from "@/lib/server/orders-data";
import AdminCombinedOrdersContent from "@/components/admin/AdminCombinedOrdersContent";

/** REQ-0021 — session shell + Suspense-streamed admin orders */
export default async function AdminOrdersPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminCombinedOrdersContent />}>
      <AdminOrdersPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminOrdersPageWithData({ userId }: { userId: string }) {
  const initialOrders = await getOrdersForUser(userId);
  return <AdminCombinedOrdersContent initialOrders={initialOrders} />;
}
