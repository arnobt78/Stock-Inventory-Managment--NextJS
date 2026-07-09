import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupplierDetailForPage } from "@/lib/server/supplier-detail-data";
import SupplierDetailPage from "@/components/Pages/SupplierDetailPage";
import type { Supplier } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminSupplierDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const initialSupplier = await getSupplierDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialSupplier) notFound();

  return (
    <SupplierDetailPage
      embedInAdmin
      initialSupplier={initialSupplier as unknown as Supplier}
    />
  );
}
