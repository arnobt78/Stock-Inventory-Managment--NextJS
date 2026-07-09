import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getAdminCounts } from "@/lib/server/admin-counts";
import AdminLayout from "@/components/layouts/AdminLayout";

/** Admin layout — SSR sidebar counts so badges render without client fetch flash (REQ-0025). */
export const dynamic = "force-dynamic";

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  const initialCounts = await getAdminCounts(user.id);
  return <AdminLayout initialCounts={initialCounts}>{children}</AdminLayout>;
}
