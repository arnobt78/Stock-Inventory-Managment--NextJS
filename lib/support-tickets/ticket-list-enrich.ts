/**
 * REQ-0185 — shared ticket list transform + Redis list:v2 shape guard.
 */

import type { SupportTicket } from "@/types";

export type TicketUserSnap = {
  name: string | null;
  email: string;
  image?: string | null;
};

/** Prisma ticket row shape used by list transforms. */
export type TicketListRecord = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  userId: string;
  assignedToId: string | null;
  productId: string | null;
  orderId: string | null;
  supplierId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export function transformSupportTicketListRow(
  r: TicketListRecord,
  creator?: TicketUserSnap | null,
  assignedTo?: TicketUserSnap | null,
  replyCount?: number,
): SupportTicket {
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
    creatorName: creator?.name ?? undefined,
    creatorEmail: creator?.email ?? undefined,
    creatorImage: creator?.image ?? null,
    assignedToName: assignedTo?.name ?? undefined,
    assignedToEmail: assignedTo?.email ?? undefined,
    assignedToImage: assignedTo?.image ?? null,
    replyCount: replyCount ?? 0,
  };
}

/** True when cached list rows include REQ-0185 image densify fields. */
export function hasTicketListV2Shape(
  cached: SupportTicket[] | null,
): cached is SupportTicket[] {
  if (cached == null) return false;
  if (cached.length === 0) return true;
  const first = cached[0];
  return first != null && "creatorImage" in first && "assignedToImage" in first;
}
