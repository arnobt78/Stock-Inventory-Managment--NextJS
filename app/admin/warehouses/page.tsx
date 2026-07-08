import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";
import AdminWarehousesContent from "@/components/admin/AdminWarehousesContent";

/** REQ-0021 — session shell + Suspense-streamed admin warehouses */
export default async function AdminWarehousesPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminWarehousesContent />}>
      <AdminWarehousesPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminWarehousesPageWithData({ userId }: { userId: string }) {
  const initialWarehouses = await getWarehousesForUser(userId);
  return <AdminWarehousesContent initialWarehouses={initialWarehouses} />;
}
