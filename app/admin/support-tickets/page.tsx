import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import {
  getSupportTicketsForAdmin,
  getProductOwnersForSupport,
} from "@/lib/server/support-tickets-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import AdminSupportTicketsContent from "@/components/admin/AdminSupportTicketsContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminSupportTicketsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialTickets, productOwners, listStats] = await Promise.all([
    getSupportTicketsForAdmin(user.id),
    getProductOwnersForSupport(),
    prefetchListPageStats(user),
  ]);

  return (
    <AdminSupportTicketsContent
      initialTickets={initialTickets}
      initialStats={listStats.initialStats}
      productOwners={productOwners}
    />
  );
}
