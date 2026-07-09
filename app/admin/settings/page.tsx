import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSystemConfigForAdmin } from "@/lib/server/system-config-data";
import AdminSettingsContent from "@/components/admin/AdminSettingsContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  const initialConfigs = await getSystemConfigForAdmin();
  return <AdminSettingsContent initialConfigs={initialConfigs} />;
}
