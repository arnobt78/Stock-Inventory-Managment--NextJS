import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getUsersForAdmin } from "@/lib/server/users-data";
import AdminUserManagementContent from "@/components/admin/AdminUserManagementContent";

/**
 * Admin User Management page — list users, link to detail.
 * REQ-0021 — session shell + Suspense-streamed users.
 */
export default async function AdminUserManagementPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  return (
    <Suspense fallback={<AdminUserManagementContent />}>
      <AdminUserManagementPageWithData />
    </Suspense>
  );
}

async function AdminUserManagementPageWithData() {
  const initialUsers = await getUsersForAdmin();
  return <AdminUserManagementContent initialUsers={initialUsers} />;
}
