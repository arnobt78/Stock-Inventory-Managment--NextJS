import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupportTicketDetailForPage } from "@/lib/server/support-ticket-detail-data";
import { getSupportTicketRepliesForPage } from "@/lib/server/support-ticket-replies-data";
import { getProductOwnersForSupport } from "@/lib/server/support-tickets-data";
import AdminSupportTicketDetailContent from "@/components/admin/AdminSupportTicketDetailContent";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminSupportTicketDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  // REQ-0191 — productOwners for footer Reassign
  const [initialTicket, initialReplies, productOwners] = await Promise.all([
    getSupportTicketDetailForPage({ id: user.id, role: user.role }, id),
    getSupportTicketRepliesForPage(id),
    getProductOwnersForSupport(),
  ]);
  if (!initialTicket) notFound();

  return (
    <AdminSupportTicketDetailContent
      initialTicket={initialTicket}
      initialReplies={initialReplies}
      productOwners={productOwners}
    />
  );
}
