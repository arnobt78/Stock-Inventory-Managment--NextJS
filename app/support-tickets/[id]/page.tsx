import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupportTicketDetailForPage } from "@/lib/server/support-ticket-detail-data";
import { getSupportTicketRepliesForPage } from "@/lib/server/support-ticket-replies-data";
import { getProductOwnersForSupport } from "@/lib/server/support-tickets-data";
import SupportTicketDetailContent from "@/components/support-tickets/SupportTicketDetailContent";

type Props = { params: Promise<{ id: string }> };

/** REQ-0094 — explicit force-dynamic for shell-first parity. */
export const dynamic = "force-dynamic";

/**
 * User-facing Support Ticket detail page (SSR).
 * REQ-0191 — uses canMutateSupportTicket via getSupportTicketDetailForPage.
 */
export default async function SupportTicketDetailRoute({ params }: Props) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const [initialTicket, initialReplies, productOwners] = await Promise.all([
    getSupportTicketDetailForPage({ id: user.id, role: user.role }, id),
    getSupportTicketRepliesForPage(id),
    getProductOwnersForSupport(),
  ]);
  if (!initialTicket) {
    notFound();
  }

  return (
    <SupportTicketDetailContent
      initialTicket={initialTicket}
      initialReplies={initialReplies}
      productOwners={productOwners}
    />
  );
}
