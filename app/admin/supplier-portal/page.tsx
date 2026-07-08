import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupplierPortalForAdmin } from "@/lib/server/supplier-portal-data";
import AdminSupplierPortalContent from "@/components/admin/AdminSupplierPortalContent";

/** REQ-0021 — session shell + Suspense-streamed supplier portal */
export default async function AdminSupplierPortalPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  return (
    <Suspense fallback={<AdminSupplierPortalContent />}>
      <AdminSupplierPortalPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminSupplierPortalPageWithData({ userId }: { userId: string }) {
  const initialStats = await getSupplierPortalForAdmin(userId);
  return <AdminSupplierPortalContent initialStats={initialStats} />;
}
