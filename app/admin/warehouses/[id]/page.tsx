import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getWarehouseDetailForPage } from "@/lib/server/warehouse-detail-data";
import { getStockByWarehouseForPage } from "@/lib/server/warehouse-stock-data";
import WarehouseDetailPage from "@/components/Pages/WarehouseDetailPage";
import type { Warehouse } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminWarehouseDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const [initialWarehouse, initialStockAllocations] = await Promise.all([
    getWarehouseDetailForPage({ id: user.id, role: user.role }, id),
    getStockByWarehouseForPage(user.id, id),
  ]);
  if (!initialWarehouse) notFound();

  return (
    <WarehouseDetailPage
      embedInAdmin
      initialWarehouse={initialWarehouse as unknown as Warehouse}
      initialStockAllocations={initialStockAllocations ?? []}
    />
  );
}
