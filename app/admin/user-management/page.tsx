import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getUsersForAdmin } from "@/lib/server/users-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import AdminUserManagementContent from "@/components/admin/AdminUserManagementContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminUserManagementPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  const [initialUsers, listStats] = await Promise.all([
    getUsersForAdmin(),
    prefetchListPageStats(user),
  ]);
  return (
    <AdminUserManagementContent
      initialUsers={initialUsers}
      initialStats={listStats.initialStats}
    />
  );
}
