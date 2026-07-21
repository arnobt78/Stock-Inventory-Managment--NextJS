/**
 * REQ-0190 — Support ticket update access + Send-to (assignedToId) mutation policy.
 * Creator/assignee/admin may update ticket fields; only admin may change assignee.
 * REQ-0195 — only admin may change workflow status (non-admin body.status ignored).
 */

import type { SupportTicketStatus } from "@/types";

export type TicketAssigneeSession = {
  id: string;
  role: string;
};

export type TicketAssigneeRecord = {
  userId: string;
  assignedToId: string | null;
};

/** Who may PUT ticket metadata (subject/priority/etc.). */
export function canMutateSupportTicket(
  session: TicketAssigneeSession,
  ticket: TicketAssigneeRecord,
): boolean {
  if (session.role === "admin") return true;
  if (ticket.userId === session.id) return true;
  if (ticket.assignedToId === session.id) return true;
  return false;
}

/**
 * Resolve whether assignedToId from the body should be applied.
 * Non-admin: always undefined (ignored). Admin: pass through (including null).
 */
export function resolveAssignedToUpdate(
  session: TicketAssigneeSession,
  assignedToId: string | null | undefined,
): string | null | undefined {
  if (assignedToId === undefined) return undefined;
  if (session.role !== "admin") return undefined;
  return assignedToId;
}

/**
 * REQ-0195 — workflow status is admin-owned.
 * Non-admin: undefined (ignored even if body includes status).
 * Admin: pass through when provided.
 */
export function resolveStatusUpdate(
  session: TicketAssigneeSession,
  status: SupportTicketStatus | undefined,
): SupportTicketStatus | undefined {
  if (status === undefined) return undefined;
  if (session.role !== "admin") return undefined;
  return status;
}
