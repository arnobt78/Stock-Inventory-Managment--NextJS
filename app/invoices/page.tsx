import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import InvoicesPage from "@/components/Pages/InvoicesPage";
import {
  getInvoicesForClientId,
  getInvoicesForSupplierId,
  getInvoicesForUser,
} from "@/lib/server/invoices-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import { getSupplierByUserId } from "@/prisma/supplier";

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
        userRole={userRole}
        initialInvoices={initialInvoices}
        initialClientPortal={listStats.initialClientPortal}
      />
    );
  }

  if (userRole === "supplier") {
    const supplier = await getSupplierByUserId(user.id);
    const initialInvoices = supplier
      ? await getInvoicesForSupplierId(supplier.id)
      : [];
    return (
      <InvoicesPage
        userRole={userRole}
        initialInvoices={initialInvoices}
      />
    );
  }

  // REQ-0159 — Self-only table (parity with /orders); store KPIs via dashboard
  const [initialInvoices, listStats] = await Promise.all([
    getInvoicesForUser(user.id),
    prefetchListPageStats(user),
  ]);

  return (
    <InvoicesPage
      userRole={userRole}
      initialInvoices={initialInvoices}
      initialStats={listStats.initialStats}
    />
  );
}
