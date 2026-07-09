import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupplierDashboard } from "@/lib/server/supplier-dashboard";
import SupplierPortalPage from "@/components/Pages/SupplierPortalPage";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function SupplierPortalRoute() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "supplier" && user.role !== "admin") redirect("/");

  const initialDashboard = await getSupplierDashboard(user.id);
  return <SupplierPortalPage initialDashboard={initialDashboard ?? undefined} />;
}
