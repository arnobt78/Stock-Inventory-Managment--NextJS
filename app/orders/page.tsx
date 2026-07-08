import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import OrdersPage from "@/components/Pages/OrdersPage";
import {
  getOrdersForUser,
  getOrdersForClientId,
  getOrdersForSupplierId,
} from "@/lib/server/orders-data";
import { getSupplierByUserId } from "@/prisma/supplier";

/** REQ-0021 — session shell + Suspense-streamed orders */
export default async function OrdersRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<OrdersPage userRole={user.role ?? undefined} />}>
      <OrdersPageWithData userId={user.id} userRole={user.role ?? undefined} />
    </Suspense>
  );
}

async function OrdersPageWithData({
  userId,
  userRole,
}: {
  userId: string;
  userRole?: string;
}) {
  let initialOrders;

  if (userRole === "client") {
    initialOrders = await getOrdersForClientId(userId);
  } else if (userRole === "supplier") {
    const [supplier] = await Promise.all([getSupplierByUserId(userId)]);
    initialOrders = supplier
      ? await getOrdersForSupplierId(supplier.id)
      : [];
  } else {
    initialOrders = await getOrdersForUser(userId);
  }

  return (
    <OrdersPage initialOrders={initialOrders} userRole={userRole} />
  );
}
