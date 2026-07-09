import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getClientPortalForAdmin } from "@/lib/server/client-portal-data";
import AdminClientPortalContent from "@/components/admin/AdminClientPortalContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminClientPortalPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  const initialStats = await getClientPortalForAdmin();
  return <AdminClientPortalContent initialStats={initialStats} />;
}
