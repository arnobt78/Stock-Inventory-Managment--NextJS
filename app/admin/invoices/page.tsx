import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { getInvoicesForUser } from "@/lib/server/invoices-data";
import AdminCombinedInvoicesContent from "@/components/admin/AdminCombinedInvoicesContent";

/** REQ-0021 — session shell + Suspense-streamed admin invoices */
export default async function AdminInvoicesPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminCombinedInvoicesContent />}>
      <AdminInvoicesPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminInvoicesPageWithData({ userId }: { userId: string }) {
  const initialInvoices = await getInvoicesForUser(userId);
  return <AdminCombinedInvoicesContent initialInvoices={initialInvoices} />;
}
