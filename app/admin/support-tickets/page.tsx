import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import {
  getSupportTicketsForAdmin,
  getProductOwnersForSupport,
} from "@/lib/server/support-tickets-data";
import AdminSupportTicketsContent from "@/components/admin/AdminSupportTicketsContent";

/** REQ-0021 — session shell + Suspense-streamed support tickets */
export default async function AdminSupportTicketsPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminSupportTicketsContent />}>
      <AdminSupportTicketsPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminSupportTicketsPageWithData({ userId }: { userId: string }) {
  const [initialTickets, productOwners] = await Promise.all([
    getSupportTicketsForAdmin(userId),
    getProductOwnersForSupport(),
  ]);

  return (
    <AdminSupportTicketsContent
      initialTickets={initialTickets}
      productOwners={productOwners}
    />
  );
}
