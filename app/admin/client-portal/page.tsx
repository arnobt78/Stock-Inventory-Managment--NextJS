import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getClientPortalForAdmin } from "@/lib/server/client-portal-data";
import AdminClientPortalContent from "@/components/admin/AdminClientPortalContent";

/** REQ-0021 — session shell + Suspense-streamed client portal */
export default async function AdminClientPortalPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  return (
    <Suspense fallback={<AdminClientPortalContent />}>
      <AdminClientPortalPageWithData />
    </Suspense>
  );
}

async function AdminClientPortalPageWithData() {
  const initialStats = await getClientPortalForAdmin();
  return <AdminClientPortalContent initialStats={initialStats} />;
}
