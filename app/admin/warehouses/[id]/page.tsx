import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getWarehouseDetailForPage } from "@/lib/server/warehouse-detail-data";
import { getStockByWarehouseForPage } from "@/lib/server/warehouse-stock-data";
import { getCachedForecastingSummary } from "@/lib/server/forecasting-data";
import WarehouseDetailPage from "@/components/Pages/WarehouseDetailPage";
import type { Warehouse } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch. REQ-0084 — warehouse insights + admin forecast. */
export const dynamic = "force-dynamic";

export default async function AdminWarehouseDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const session = { id: user.id, role: user.role };

  const [initialWarehouse, initialStockAllocations, initialForecasting] =
    await Promise.all([
      getWarehouseDetailForPage(session, id),
      getStockByWarehouseForPage(session, id),
      user.role === "admin"
        ? getCachedForecastingSummary(user.id)
        : Promise.resolve(null),
    ]);
  if (!initialWarehouse) notFound();

  return (
    <WarehouseDetailPage
      embedInAdmin
      initialWarehouse={initialWarehouse as unknown as Warehouse}
      initialStockAllocations={initialStockAllocations ?? []}
      initialForecasting={initialForecasting}
    />
  );
}
