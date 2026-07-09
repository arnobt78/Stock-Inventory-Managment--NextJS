/**
 * Shared support ticket detail response transform — used by API GET/PUT and SSR prefetch.
 * REQ-0024: single source of truth for support ticket detail JSON shape.
 */

import type { SupportTicket } from "@/types";
import type { getSupportTicketById } from "@/prisma/support-ticket";

type SupportTicketRecord = NonNullable<
  Awaited<ReturnType<typeof getSupportTicketById>>
>;

export function transformSupportTicketDetail(
  r: SupportTicketRecord,
  opts?: {
    creator?: { name: string | null; email: string } | null;
    assignedTo?: { name: string | null; email: string } | null;
  },
): SupportTicket {
  const created = new Date(r.createdAt);
  const ticketNumber = `TKT-${created.toISOString().slice(0, 10).replace(/-/g, "")}-${r.id.slice(-6)}`;
  return {
    id: r.id,
    subject: r.subject,
    description: r.description,
    status: r.status as SupportTicket["status"],
    priority: r.priority as SupportTicket["priority"],
    userId: r.userId,
    assignedToId: r.assignedToId,
    productId: r.productId,
    orderId: r.orderId,
    supplierId: r.supplierId,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
    ticketNumber,
    creatorName: opts?.creator?.name ?? undefined,
    creatorEmail: opts?.creator?.email ?? undefined,
    assignedToName: opts?.assignedTo?.name ?? undefined,
    assignedToEmail: opts?.assignedTo?.email ?? undefined,
  };
}
