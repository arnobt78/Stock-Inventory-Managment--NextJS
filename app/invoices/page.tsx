import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import InvoicesPage from "@/components/Pages/InvoicesPage";
import {
  getInvoicesForClientId,
  getStoreInvoicesForAdmin,
} from "@/lib/server/invoices-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function InvoicesRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const userRole = user.role ?? undefined;

  if (userRole === "client") {
    const [initialInvoices, listStats] = await Promise.all([
      getInvoicesForClientId(user.id),
      prefetchListPageStats(user),
    ]);
    return (
      <InvoicesPage
        initialInvoices={initialInvoices}
        initialClientPortal={listStats.initialClientPortal}
      />
    );
  }

  const [initialInvoices, listStats] = await Promise.all([
    getStoreInvoicesForAdmin(user.id),
    prefetchListPageStats(user),
  ]);

  return (
    <InvoicesPage
      initialInvoices={initialInvoices}
      initialStats={listStats.initialStats}
    />
  );
}
