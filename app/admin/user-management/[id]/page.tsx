import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getUserDetailForPage } from "@/lib/server/user-detail-data";
import AdminUserManagementDetailContent from "@/components/admin/AdminUserManagementDetailContent";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminUserManagementDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");
  const { id } = await params;

  const initialUser = await getUserDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialUser) notFound();

  return <AdminUserManagementDetailContent initialUser={initialUser} />;
}
