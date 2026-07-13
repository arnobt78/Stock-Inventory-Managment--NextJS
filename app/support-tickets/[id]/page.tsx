import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSupportTicketById } from "@/prisma/support-ticket";
import { prisma } from "@/prisma/client";
import SupportTicketDetailContent from "@/components/support-tickets/SupportTicketDetailContent";
import { getSupportTicketRepliesForPage } from "@/lib/server/support-ticket-replies-data";
import type { SupportTicket } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0094 — explicit force-dynamic for shell-first parity. */
export const dynamic = "force-dynamic";

function ticketNumber(createdAt: Date, id: string): string {
  const ymd = createdAt.toISOString().slice(0, 10).replace(/-/g, "");
  return `TKT-${ymd}-${id.slice(-6)}`;
}

/**
 * User-facing Support Ticket detail page (SSR).
 * Only creator, assignee, or admin can view.
 */
export default async function SupportTicketDetailRoute({ params }: Props) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const record = await getSupportTicketById(id);
  if (!record) {
    notFound();
  }

  const isAdmin = user.role === "admin";
  const isCreator = record.userId === user.id;
  const isAssignee = record.assignedToId === user.id;
  if (!isAdmin && !isCreator && !isAssignee) {
    notFound();
  }

  const [creator, assignedTo] = await Promise.all([
    prisma.user.findUnique({
      where: { id: record.userId },
      select: { name: true, email: true },
    }),
    record.assignedToId
      ? prisma.user.findUnique({
          where: { id: record.assignedToId },
          select: { name: true, email: true },
        })
      : null,
  ]);

  const ticket: SupportTicket = {
    id: record.id,
    subject: record.subject,
    description: record.description,
    status: record.status as SupportTicket["status"],
    priority: record.priority as SupportTicket["priority"],
    userId: record.userId,
    assignedToId: record.assignedToId,
    productId: record.productId,
    orderId: record.orderId,
    supplierId: record.supplierId,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt?.toISOString() ?? null,
    ticketNumber: ticketNumber(record.createdAt, record.id),
    creatorName: creator?.name ?? null,
    creatorEmail: creator?.email ?? null,
    assignedToName: assignedTo?.name ?? null,
    assignedToEmail: assignedTo?.email ?? null,
  };

  const initialReplies = await getSupportTicketRepliesForPage(id);

  return (
    <SupportTicketDetailContent
      initialTicket={ticket}
      initialReplies={initialReplies}
    />
  );
}
