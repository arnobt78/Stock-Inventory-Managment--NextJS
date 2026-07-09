import { getSession } from "@/lib/auth-server";
import {
  getSupportTicketsForAdmin,
  getProductOwnersForSupport,
} from "@/lib/server/support-tickets-data";
import AdminSupportTicketsContent from "@/components/admin/AdminSupportTicketsContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminSupportTicketsPage() {
  const user = await getSession();
  if (!user) return null;

  const [initialTickets, productOwners] = await Promise.all([
    getSupportTicketsForAdmin(user.id),
    getProductOwnersForSupport(),
  ]);

  return (
    <AdminSupportTicketsContent
      initialTickets={initialTickets}
      productOwners={productOwners}
    />
  );
}
