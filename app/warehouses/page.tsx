import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import WarehousesPage from "@/components/Pages/WarehousesPage";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";

/** REQ-0021 — session shell + Suspense-streamed warehouses */
export default async function WarehousesRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<WarehousesPage />}>
      <WarehousesPageWithData userId={user.id} />
    </Suspense>
  );
}

async function WarehousesPageWithData({ userId }: { userId: string }) {
  const initialWarehouses = await getWarehousesForUser(userId);
  return <WarehousesPage initialWarehouses={initialWarehouses} />;
}
