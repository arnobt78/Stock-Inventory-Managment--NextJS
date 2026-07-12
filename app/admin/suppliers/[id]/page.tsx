import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupplierDetailForPage } from "@/lib/server/supplier-detail-data";
import { getCachedForecastingSummary } from "@/lib/server/forecasting-data";
import SupplierDetailPage from "@/components/Pages/SupplierDetailPage";
import type { Supplier } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch. REQ-0084 — admin cache-read forecast. */
export const dynamic = "force-dynamic";

export default async function AdminSupplierDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const [initialSupplier, initialForecasting] = await Promise.all([
    getSupplierDetailForPage({ id: user.id, role: user.role }, id),
    user.role === "admin"
      ? getCachedForecastingSummary(user.id)
      : Promise.resolve(null),
  ]);
  if (!initialSupplier) notFound();

  return (
    <SupplierDetailPage
      embedInAdmin
      initialSupplier={initialSupplier as unknown as Supplier}
      initialForecasting={initialForecasting}
    />
  );
}
