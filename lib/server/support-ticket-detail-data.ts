/**
 * Server-side support ticket detail fetch for SSR prefetch.
 * Mirrors GET /api/support-tickets/:id auth + response shape.
 * REQ-0024 · REQ-0191 — admin OR creator OR assignee (canMutateSupportTicket).
 */

import { prisma } from "@/prisma/client";
import { getSupportTicketById } from "@/prisma/support-ticket";
import { transformSupportTicketDetail } from "@/lib/support-tickets/transform-support-ticket-detail";
import { canMutateSupportTicket } from "@/lib/support-tickets/ticket-assignee-policy";
import {
  loadTicketRelatedSnap,
  mergeTicketRelated,
} from "@/lib/support-tickets/ticket-related-enrich";
import type { SupportTicket } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

/** Admin/creator/assignee support ticket detail for page SSR — null when not found or unauthorized. */
export async function getSupportTicketDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<SupportTicket | null> {
  const record = await getSupportTicketById(id);
  if (!record) return null;

  const sessionId = session.id ?? "";
  const sessionRole = session.role ?? "";
  if (
    !sessionId ||
    !canMutateSupportTicket(
      { id: sessionId, role: sessionRole },
      {
        userId: record.userId,
        assignedToId: record.assignedToId ?? null,
      },
    )
  ) {
    return null;
  }

  const [creator, assignedTo, related] = await Promise.all([
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
    loadTicketRelatedSnap({
      productId: record.productId,
      orderId: record.orderId,
      supplierId: record.supplierId,
    }),
  ]);

  const base = transformSupportTicketDetail(record, {
    creator: creator ?? null,
    assignedTo: assignedTo ?? null,
  });
  return mergeTicketRelated(base, related);
}
