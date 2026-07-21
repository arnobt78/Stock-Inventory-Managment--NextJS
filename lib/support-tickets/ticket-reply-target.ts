/**
 * REQ-0197 — Role-aware “Reply to” target for ticket chat header/placeholder.
 * Creator → assignee (or “Support”); assignee/admin staff → creator.
 */

import type { SupportTicket } from "@/types";

export type TicketReplyTarget = {
  /** Display name for “Reply to {name}” */
  name: string;
  /** Linked user id when known (null for generic Support) */
  userId: string | null;
};

/**
 * Resolve who the current viewer is composing a reply toward.
 */
export function resolveTicketReplyTarget(
  ticket: Pick<
    SupportTicket,
    | "userId"
    | "creatorName"
    | "creatorEmail"
    | "assignedToId"
    | "assignedToName"
    | "assignedToEmail"
  >,
  sessionUserId: string | undefined | null,
  isAdminRole: boolean,
): TicketReplyTarget {
  const creatorName =
    ticket.creatorName?.trim() || ticket.creatorEmail || "user";
  const assigneeName =
    ticket.assignedToName?.trim() ||
    ticket.assignedToEmail ||
    null;

  const isCreator =
    !!sessionUserId && sessionUserId === ticket.userId;
  const isAssignee =
    !!sessionUserId &&
    !!ticket.assignedToId &&
    sessionUserId === ticket.assignedToId;

  // Creator (including admin who opened the ticket) → reply to Send-to / Support
  if (isCreator) {
    if (ticket.assignedToId && assigneeName) {
      return { name: assigneeName, userId: ticket.assignedToId };
    }
    return { name: "Support", userId: null };
  }

  // Assignee → reply to creator
  if (isAssignee) {
    return { name: creatorName, userId: ticket.userId };
  }

  // Admin staff (or other mutators) on ticket → reply to creator
  if (isAdminRole) {
    return { name: creatorName, userId: ticket.userId };
  }

  // Fallback: treat as staff talking to creator
  return { name: creatorName, userId: ticket.userId };
}
