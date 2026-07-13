import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import {
  getSupportTicketsForUser,
  getProductOwnersForSupport,
} from "@/lib/server/support-tickets-data";
import SupportTicketsPageContent from "@/components/support-tickets/SupportTicketsPageContent";

/** REQ-0094 — explicit force-dynamic for shell-first parity. */
export const dynamic = "force-dynamic";

/**
 * User-facing Support Tickets page (SSR).
 * Any logged-in user (user, admin, client, supplier) can create and view their own tickets.
 */
export default async function SupportTicketsRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const [initialTickets, productOwners] = await Promise.all([
    getSupportTicketsForUser(user.id),
    getProductOwnersForSupport(),
  ]);

  return (
    <SupportTicketsPageContent
      initialTickets={initialTickets}
      productOwners={productOwners}
    />
  );
}
