/**
 * Server-side support ticket detail fetch for SSR prefetch.
 * Mirrors GET /api/support-tickets/:id auth + response shape.
 * REQ-0024
 */

import { prisma } from "@/prisma/client";
import { getSupportTicketById } from "@/prisma/support-ticket";
import { transformSupportTicketDetail } from "@/lib/support-tickets/transform-support-ticket-detail";
import type { SupportTicket } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

/** Creator/assignee-scoped support ticket detail for page SSR — null when not found or unauthorized. */
export async function getSupportTicketDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<SupportTicket | null> {
  const record = await getSupportTicketById(id);
  if (!record) return null;

  const isCreator = record.userId === session.id;
  const isAssignee = record.assignedToId === session.id;
  if (!isCreator && !isAssignee) return null;

  const [creator, assignedTo] = await Promise.all([
    prisma.user.findUnique({
      where: { id: record.userId },
      select: { name: true, email: true, image: true },
    }),
    record.assignedToId
      ? prisma.user.findUnique({
          where: { id: record.assignedToId },
          select: { name: true, email: true, image: true },
        })
      : null,
  ]);

  return transformSupportTicketDetail(record, {
    creator: creator ?? null,
    assignedTo: assignedTo ?? null,
  });
}
