import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupplierPortalForAdmin } from "@/lib/server/supplier-portal-data";
import AdminSupplierPortalContent from "@/components/admin/AdminSupplierPortalContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminSupplierPortalPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  const initialStats = await getSupplierPortalForAdmin(user.id);
  return <AdminSupplierPortalContent initialStats={initialStats} />;
}
