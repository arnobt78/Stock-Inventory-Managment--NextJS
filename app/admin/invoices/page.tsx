import { getSession } from "@/lib/auth-server";
import {
  getInvoicesForUser,
  getClientInvoicesForProductOwner,
} from "@/lib/server/invoices-data";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import AdminCombinedInvoicesContent from "@/components/admin/AdminCombinedInvoicesContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const user = await getSession();
  if (!user) return null;

  const [initialInvoices, initialClientInvoices, initialStats] =
    await Promise.all([
      getInvoicesForUser(user.id),
      getClientInvoicesForProductOwner(user.id),
      getDashboardForAdmin(user.id),
    ]);

  return (
    <AdminCombinedInvoicesContent
      initialInvoices={initialInvoices}
      initialClientInvoices={initialClientInvoices}
      initialStats={initialStats}
    />
  );
}
